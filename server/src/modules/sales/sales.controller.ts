import type { RequestHandler } from 'express';
import { isValidObjectId, startSession, type ClientSession } from 'mongoose';
import { z } from 'zod';
import { getDatabaseTarget } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { BranchModel } from '../branches/branch.model.js';
import { ProductModel } from '../catalog/product.model.js';
import { InventoryAdjustmentModel } from '../inventory/inventory-adjustment.model.js';
import { InventoryBalanceModel } from '../inventory/inventory-balance.model.js';
import { UserModel } from '../users/user.model.js';
import { CustomerModel } from '../customers/customer.model.js';
import { BusinessModel } from '../businesses/business.model.js';
import { SaleModel } from './sale.model.js';

const saleSchema = z.object({
  branchId: z.string().min(1),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive().max(100_000), saleUnit: z.enum(['base', 'package']).default('base') })).min(1).max(100),
  paymentMethod: z.enum(['cash', 'mtn_momo', 'airtel_money', 'card', 'bank_transfer', 'credit', 'mobile_money']),
  amountPaid: z.coerce.number().min(0),
  customerId: z.string().refine(isValidObjectId, 'Customer is invalid').optional(),
});
const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const requireAuth = (request: Express.Request) => { if (!request.auth) throw new ApiError(401, 'Authentication is required'); return request.auth; };

export const createSale: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request);
    const parsed = saleSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Sale details are invalid', parsed.error.flatten().fieldErrors);
    const quantities = new Map<string, { productId: string; quantity: number; saleUnit: 'base' | 'package' }>();
    for (const item of parsed.data.items) { const key = `${item.productId}:${item.saleUnit}`; const previous = quantities.get(key); quantities.set(key, { productId: item.productId, quantity: (previous?.quantity ?? 0) + item.quantity, saleUnit: item.saleUnit }); }
    const itemInputs = [...quantities.values()];
    const productIds = [...new Set(itemInputs.map((item) => item.productId))];
    const [branch, user, products, customer, business] = await Promise.all([
      BranchModel.findOne({ _id: parsed.data.branchId, businessId: auth.businessId, isActive: true }).lean(),
      UserModel.findById(auth.userId).select('branchIds role firstName lastName').lean(),
      ProductModel.find({ _id: { $in: productIds }, businessId: auth.businessId, isActive: true }).lean(),
      parsed.data.customerId ? CustomerModel.findOne({ _id: parsed.data.customerId, businessId: auth.businessId, isActive: true }).lean() : null,
      BusinessModel.findById(auth.businessId).lean(),
    ]);
    if (!branch || !business) throw new ApiError(422, 'Select an active branch in this business');
    if (!user) throw new ApiError(401, 'User account is unavailable');
    if (!['owner', 'admin'].includes(user.role) && !user.branchIds.some((id) => id.toString() === branch._id.toString())) throw new ApiError(403, 'You do not have access to this branch');
    if (products.length !== productIds.length) throw new ApiError(422, 'One or more products are unavailable');
    if (parsed.data.customerId && !customer) throw new ApiError(422, 'Selected customer is unavailable');
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));
    const items = itemInputs.map((input) => {
      const product = productsById.get(input.productId);
      if (!product) throw new ApiError(422, 'Product is unavailable');
      if (input.saleUnit === 'package' && (!product.packageName || !product.packageSize || product.packageSellingPrice === undefined)) throw new ApiError(422, `${product.name} does not have package selling configured`);
      const stockQuantity = input.saleUnit === 'package' ? input.quantity * product.packageSize! : input.quantity;
      const unitPrice = input.saleUnit === 'package' ? product.packageSellingPrice! : product.sellingPrice;
      return { productId: product._id, name: product.name, sku: product.sku, quantity: input.quantity, stockQuantity, unitLabel: input.saleUnit === 'package' ? product.packageName : product.unit, unitPrice, unitCost: product.costPrice, lineTotal: roundMoney(input.quantity * unitPrice) };
    });
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
    if (parsed.data.paymentMethod !== 'credit' && parsed.data.amountPaid < subtotal) throw new ApiError(422, 'Amount paid is less than the sale total');
    if (parsed.data.paymentMethod === 'credit' && !customer) throw new ApiError(422, 'Select a customer for a credit sale');
    if (parsed.data.amountPaid > subtotal && parsed.data.paymentMethod !== 'cash') throw new ApiError(422, 'Only cash payments can be greater than the sale total');
    const balanceDue = roundMoney(Math.max(0, subtotal - parsed.data.amountPaid));
    const changeDue = roundMoney(Math.max(0, parsed.data.amountPaid - subtotal));
    const paymentStatus = balanceDue === 0 ? 'paid' : parsed.data.amountPaid > 0 ? 'partial' : 'unpaid';
    const persistSale = async (session?: ClientSession) => {
      const updated: Array<{ productId: string; quantity: number; before: number }> = [];
      try {
      for (const item of items) {
        const balance = await InventoryBalanceModel.findOneAndUpdate(
          { businessId: auth.businessId, branchId: branch._id, productId: item.productId, quantity: { $gte: item.stockQuantity } },
          { $inc: { quantity: -item.stockQuantity } }, { new: false, ...(session ? { session } : {}) },
        );
        if (!balance) throw new ApiError(409, `Insufficient stock for ${item.name}`);
        updated.push({ productId: item.productId.toString(), quantity: item.stockQuantity, before: balance.quantity });
      }
      const receiptNumber = `S-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        const [sale] = await SaleModel.create([{ businessId: auth.businessId, branchId: branch._id, cashierId: auth.userId, ...(customer ? { customerId: customer._id, customerName: customer.name } : {}), receiptNumber, items, subtotal, total: subtotal, paymentMethod: parsed.data.paymentMethod, amountPaid: parsed.data.amountPaid, changeDue, balanceDue, paymentStatus }], session ? { session } : {});
        if (!sale) throw new ApiError(500, 'Sale record was not created');
        await InventoryAdjustmentModel.insertMany(updated.map((item) => ({ businessId: auth.businessId, branchId: branch._id, productId: item.productId, userId: auth.userId, change: -item.quantity, quantityBefore: item.before, quantityAfter: item.before - item.quantity, reason: `Sale ${receiptNumber}` })), session ? { session } : {});
        return { id: sale.id, receiptNumber, total: sale.total, subtotal: sale.subtotal, amountPaid: sale.amountPaid, changeDue: sale.changeDue, balanceDue: sale.balanceDue, paymentStatus: sale.paymentStatus, paymentMethod: sale.paymentMethod, createdAt: sale.createdAt, customerName: sale.customerName ?? '', cashierName: `${user.firstName} ${user.lastName}`, branchName: branch.name, items: sale.items, business: { name: business.name, logoUrl: business.logoUrl ?? '', phone: business.phone ?? '', email: business.email ?? '', address: business.address ?? '', tin: business.tin ?? '' } };
      } catch (error: unknown) {
        // Preserve a compensating rollback if this helper is ever used without
        // the transaction session supplied by the Atlas checkout flow.
        if (!session) {
          await Promise.allSettled(updated.map((item) => InventoryBalanceModel.updateOne({ businessId: auth.businessId, branchId: branch._id, productId: item.productId }, { $inc: { quantity: item.quantity } })));
        }
        throw error;
      }
    };

    let completedSale: Awaited<ReturnType<typeof persistSale>> | undefined;
    if (getDatabaseTarget() === 'atlas') {
      const session = await startSession();
      try {
        await session.withTransaction(async () => {
          completedSale = await persistSale(session);
        });
      } finally {
        await session.endSession();
      }
    } else {
      completedSale = await persistSale();
    }
    if (!completedSale) throw new ApiError(500, 'Sale transaction did not complete');
    response.status(201).json({ sale: completedSale });
  } catch (error: unknown) { next(error); }
};

export const listSales: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request);
    const branchId = typeof request.query.branchId === 'string' ? request.query.branchId : undefined;
    const sales = await SaleModel.find({ businessId: auth.businessId, ...(branchId ? { branchId } : {}) }).sort({ createdAt: -1 }).limit(50).lean();
    response.json({ items: sales.map((sale) => ({ id: sale._id.toString(), receiptNumber: sale.receiptNumber, branchId: sale.branchId.toString(), total: sale.total, amountPaid: sale.amountPaid, balanceDue: sale.balanceDue ?? 0, paymentStatus: sale.paymentStatus ?? 'paid', paymentMethod: sale.paymentMethod, itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0), status: sale.status, createdAt: sale.createdAt })) });
  } catch (error: unknown) { next(error); }
};

export const getSale: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request);
    if (!isValidObjectId(request.params.saleId)) throw new ApiError(422, 'Sale is invalid');
    const sale = await SaleModel.findOne({ _id: request.params.saleId, businessId: auth.businessId }).lean();
    if (!sale) throw new ApiError(404, 'Sale was not found');
    const [business, branch, cashier] = await Promise.all([
      BusinessModel.findById(auth.businessId).lean(),
      BranchModel.findById(sale.branchId).select('name').lean(),
      UserModel.findById(sale.cashierId).select('firstName lastName').lean(),
    ]);
    if (!business) throw new ApiError(404, 'Business profile was not found');
    response.json({ sale: { id: sale._id.toString(), receiptNumber: sale.receiptNumber, subtotal: sale.subtotal, total: sale.total, amountPaid: sale.amountPaid, changeDue: sale.changeDue, balanceDue: sale.balanceDue ?? 0, paymentStatus: sale.paymentStatus ?? 'paid', paymentMethod: sale.paymentMethod, status: sale.status, createdAt: sale.createdAt, customerName: sale.customerName ?? '', cashierName: cashier ? `${cashier.firstName} ${cashier.lastName}` : '', branchName: branch?.name ?? '', items: sale.items, business: { name: business.name, logoUrl: business.logoUrl ?? '', phone: business.phone ?? '', email: business.email ?? '', address: business.address ?? '', tin: business.tin ?? '' } } });
  } catch (error: unknown) { next(error); }
};
