import type { RequestHandler } from 'express';
import { isValidObjectId, startSession, type ClientSession, type HydratedDocument } from 'mongoose';
import { z } from 'zod';
import { getDatabaseTarget } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { BranchModel } from '../branches/branch.model.js';
import { ProductModel } from '../catalog/product.model.js';
import { InventoryAdjustmentModel } from '../inventory/inventory-adjustment.model.js';
import { InventoryBalanceModel } from '../inventory/inventory-balance.model.js';
import { UserModel } from '../users/user.model.js';
import { PurchaseOrderModel, type PurchaseOrder } from './purchase-order.model.js';
import { SupplierModel } from './supplier.model.js';

const supplierInput = z.object({
  name: z.string().trim().min(2).max(140),
  contactName: z.string().trim().max(120).default(''),
  phone: z.string().trim().max(40).default(''),
  email: z.union([z.literal(''), z.email()]).default(''),
});
const purchaseInput = z.object({
  branchId: z.string().refine(isValidObjectId, 'Branch is invalid'),
  supplierId: z.string().refine(isValidObjectId, 'Supplier is invalid'),
  items: z.array(z.object({
    productId: z.string().refine(isValidObjectId, 'Product is invalid'),
    quantity: z.coerce.number().positive().max(1_000_000),
    unitCost: z.coerce.number().min(0).max(1_000_000_000),
  })).min(1).max(100),
});
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const auth = (request: Express.Request) => { if (!request.auth) throw new ApiError(401, 'Authentication is required'); return request.auth; };
const accessibleBranches = async (tenant: ReturnType<typeof auth>): Promise<string[] | undefined> => {
  if (tenant.role === 'owner' || tenant.role === 'admin') return undefined;
  const user = await UserModel.findById(tenant.userId).select('branchIds').lean();
  if (!user) throw new ApiError(401, 'User account is unavailable');
  return user.branchIds.map((id) => id.toString());
};

export const listSuppliers: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request);
  const suppliers = await SupplierModel.find({ businessId: tenant.businessId }).sort({ name: 1 }).lean();
  response.json({ items: suppliers.map((item) => ({ id: item._id.toString(), name: item.name, contactName: item.contactName, phone: item.phone, email: item.email, isActive: item.isActive })) });
} catch (error) { next(error); } };

export const createSupplier: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = supplierInput.safeParse(request.body);
  if (!parsed.success) throw new ApiError(422, 'Supplier details are invalid', parsed.error.flatten().fieldErrors);
  const supplier = await SupplierModel.create({ businessId: tenant.businessId, ...parsed.data });
  response.status(201).json({ supplier: { id: supplier.id, name: supplier.name, contactName: supplier.contactName, phone: supplier.phone, email: supplier.email, isActive: supplier.isActive } });
} catch (error) { next(error); } };

export const setSupplierStatus: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = z.object({ isActive: z.boolean() }).safeParse(request.body);
  if (!parsed.success || !isValidObjectId(request.params.supplierId)) throw new ApiError(422, 'Supplier status is invalid');
  const supplier = await SupplierModel.findOneAndUpdate({ _id: request.params.supplierId, businessId: tenant.businessId }, { isActive: parsed.data.isActive }, { new: true });
  if (!supplier) throw new ApiError(404, 'Supplier was not found');
  response.json({ supplier: { id: supplier.id, isActive: supplier.isActive } });
} catch (error) { next(error); } };

export const listPurchaseOrders: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request);
  const branchIds = await accessibleBranches(tenant);
  const orders = await PurchaseOrderModel.find({ businessId: tenant.businessId, ...(branchIds ? { branchId: { $in: branchIds } } : {}) }).sort({ createdAt: -1 }).limit(100).populate('supplierId', 'name').populate('branchId', 'name').lean();
  response.json({ items: orders.map((order) => ({ id: order._id.toString(), orderNumber: order.orderNumber, supplierId: String((order.supplierId as unknown as { _id: unknown })._id), supplierName: (order.supplierId as unknown as { name: string }).name, branchId: String((order.branchId as unknown as { _id: unknown })._id), branchName: (order.branchId as unknown as { name: string }).name, items: order.items.map((item) => ({ productId: item.productId.toString(), name: item.name, sku: item.sku, quantity: item.quantity, unitCost: item.unitCost, lineTotal: item.lineTotal })), total: order.total, status: order.status, createdAt: order.createdAt, receivedAt: order.receivedAt })) });
} catch (error) { next(error); } };

export const createPurchaseOrder: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = purchaseInput.safeParse(request.body);
  if (!parsed.success) throw new ApiError(422, 'Purchase order details are invalid', parsed.error.flatten().fieldErrors);
  const quantities = new Map<string, { quantity: number; unitCost: number }>();
  for (const item of parsed.data.items) {
    const previous = quantities.get(item.productId);
    if (previous && previous.unitCost !== item.unitCost) throw new ApiError(422, 'Duplicate products must use the same unit cost');
    quantities.set(item.productId, { quantity: (previous?.quantity ?? 0) + item.quantity, unitCost: item.unitCost });
  }
  const branchIds = await accessibleBranches(tenant);
  const [branch, supplier, products] = await Promise.all([
    BranchModel.exists({ _id: parsed.data.branchId, businessId: tenant.businessId, isActive: true, ...(branchIds ? { _id: { $in: branchIds, $eq: parsed.data.branchId } } : {}) }),
    SupplierModel.exists({ _id: parsed.data.supplierId, businessId: tenant.businessId, isActive: true }),
    ProductModel.find({ _id: { $in: [...quantities.keys()] }, businessId: tenant.businessId, isActive: true }).lean(),
  ]);
  if (!branch || !supplier || products.length !== quantities.size) throw new ApiError(422, 'Select an active branch, supplier, and products in this business');
  const items = products.map((product) => { const input = quantities.get(product._id.toString()); if (!input) throw new ApiError(422, 'Product is unavailable'); return { productId: product._id, name: product.name, sku: product.sku, quantity: input.quantity, unitCost: input.unitCost, lineTotal: roundMoney(input.quantity * input.unitCost) }; });
  const total = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const order = await PurchaseOrderModel.create({ businessId: tenant.businessId, branchId: parsed.data.branchId, supplierId: parsed.data.supplierId, createdBy: tenant.userId, orderNumber, items, total });
  response.status(201).json({ purchaseOrder: { id: order.id, orderNumber, total, status: order.status, createdAt: order.createdAt } });
} catch (error) { next(error); } };

export const receivePurchaseOrder: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request);
  if (!isValidObjectId(request.params.purchaseOrderId)) throw new ApiError(422, 'Purchase order is invalid');
  const branchIds = await accessibleBranches(tenant);
  const receive = async (session?: ClientSession) => {
    const applied: Array<{ branchId: unknown; productId: unknown; quantity: number }> = [];
    let order: HydratedDocument<PurchaseOrder> | null = null;
    try {
      order = await PurchaseOrderModel.findOneAndUpdate({ _id: request.params.purchaseOrderId, businessId: tenant.businessId, status: 'draft', ...(branchIds ? { branchId: { $in: branchIds } } : {}) }, { $set: { status: 'received', receivedBy: tenant.userId, receivedAt: new Date() } }, { new: true, ...(session ? { session } : {}) });
      if (!order) throw new ApiError(409, 'Purchase order is unavailable or has already been received');
      const adjustments = [];
      for (const item of order.items) {
        const balance = await InventoryBalanceModel.findOneAndUpdate({ businessId: tenant.businessId, branchId: order.branchId, productId: item.productId }, { $inc: { quantity: item.quantity }, $setOnInsert: { businessId: tenant.businessId, branchId: order.branchId, productId: item.productId } }, { upsert: true, new: true, ...(session ? { session } : {}) });
        applied.push({ branchId: order.branchId, productId: item.productId, quantity: item.quantity });
        const before = balance.quantity - item.quantity;
        adjustments.push({ businessId: tenant.businessId, branchId: order.branchId, productId: item.productId, userId: tenant.userId, change: item.quantity, quantityBefore: before, quantityAfter: balance.quantity, reason: `Purchase order ${order.orderNumber}` });
      }
      await InventoryAdjustmentModel.insertMany(adjustments, session ? { session } : {});
      return { id: order.id, status: order.status, receivedAt: order.receivedAt };
    } catch (error) {
      if (!session && order) {
        await Promise.allSettled(applied.map((item) => InventoryBalanceModel.updateOne({ businessId: tenant.businessId, branchId: item.branchId, productId: item.productId }, { $inc: { quantity: -item.quantity } })));
        await InventoryAdjustmentModel.deleteMany({ businessId: tenant.businessId, reason: `Purchase order ${order.orderNumber}` }).catch(() => undefined);
        await PurchaseOrderModel.updateOne({ _id: order._id, status: 'received' }, { $set: { status: 'draft' }, $unset: { receivedBy: 1, receivedAt: 1 } }).catch(() => undefined);
      }
      throw error;
    }
  };
  let result: Awaited<ReturnType<typeof receive>> | undefined;
  if (getDatabaseTarget() === 'atlas') { const session = await startSession(); try { await session.withTransaction(async () => { result = await receive(session); }); } finally { await session.endSession(); } }
  else result = await receive();
  if (!result) throw new ApiError(500, 'Purchase order receipt did not complete');
  response.json({ purchaseOrder: result });
} catch (error) { next(error); } };

export const cancelPurchaseOrder: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request);
  if (!isValidObjectId(request.params.purchaseOrderId)) throw new ApiError(422, 'Purchase order is invalid');
  const branchIds = await accessibleBranches(tenant);
  const order = await PurchaseOrderModel.findOneAndUpdate({ _id: request.params.purchaseOrderId, businessId: tenant.businessId, status: 'draft', ...(branchIds ? { branchId: { $in: branchIds } } : {}) }, { $set: { status: 'cancelled' } }, { new: true });
  if (!order) throw new ApiError(409, 'Only an accessible draft purchase order can be cancelled');
  response.json({ purchaseOrder: { id: order.id, status: order.status } });
} catch (error) { next(error); } };
