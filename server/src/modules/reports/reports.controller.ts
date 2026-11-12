import type { RequestHandler } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { BranchModel } from '../branches/branch.model.js';
import { ProductModel } from '../catalog/product.model.js';
import { InventoryBalanceModel } from '../inventory/inventory-balance.model.js';
import { SaleModel } from '../sales/sale.model.js';
import { UserModel } from '../users/user.model.js';

const auth = (request: Express.Request) => { if (!request.auth) throw new ApiError(401, 'Authentication is required'); return request.auth; };
const allowedBranches = async (tenant: ReturnType<typeof auth>) => {
  if (tenant.role === 'owner' || tenant.role === 'admin') return undefined;
  const user = await UserModel.findById(tenant.userId).select('branchIds').lean();
  if (!user) throw new ApiError(401, 'User account is unavailable');
  return user.branchIds.map((id) => id.toString());
};

export const businessReport: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const now = new Date(); const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = typeof request.query.from === 'string' ? new Date(`${request.query.from}T00:00:00.000`) : defaultFrom;
  const to = typeof request.query.to === 'string' ? new Date(`${request.query.to}T23:59:59.999`) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new ApiError(422, 'Report date range is invalid');
  const permitted = await allowedBranches(tenant); const requested = typeof request.query.branchId === 'string' && isValidObjectId(request.query.branchId) ? request.query.branchId : undefined;
  if (requested && permitted && !permitted.includes(requested)) throw new ApiError(403, 'You do not have access to this branch');
  const branchIds = requested ? [requested] : permitted;
  const businessId = new Types.ObjectId(tenant.businessId); const branchFilter = branchIds ? { branchId: { $in: branchIds.map((id) => new Types.ObjectId(id)) } } : {};
  const match = { businessId, status: 'completed', createdAt: { $gte: from, $lte: to }, ...branchFilter };
  const [daily, topProducts, payments, branches, products, balances] = await Promise.all([
    SaleModel.aggregate<{ date: string; revenue: number; transactions: number }>([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, transactions: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', revenue: 1, transactions: 1 } }]),
    SaleModel.aggregate<{ productId: Types.ObjectId; name: string; sku: string; quantity: number; revenue: number }>([{ $match: match }, { $unwind: '$items' }, { $group: { _id: '$items.productId', name: { $first: '$items.name' }, sku: { $first: '$items.sku' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } }, { $sort: { revenue: -1 } }, { $limit: 10 }, { $project: { _id: 0, productId: '$_id', name: 1, sku: 1, quantity: 1, revenue: 1 } }]),
    SaleModel.aggregate<{ method: string; total: number; transactions: number }>([{ $match: match }, { $group: { _id: '$paymentMethod', total: { $sum: '$amountPaid' }, transactions: { $sum: 1 } } }, { $project: { _id: 0, method: '$_id', total: 1, transactions: 1 } }]),
    BranchModel.find({ businessId: tenant.businessId, isActive: true, ...(branchIds ? { _id: { $in: branchIds } } : {}) }).select('name').lean(),
    ProductModel.find({ businessId: tenant.businessId, isActive: true }).select('name sku unit reorderLevel').lean(),
    InventoryBalanceModel.find({ businessId: tenant.businessId, ...(branchIds ? { branchId: { $in: branchIds } } : {}) }).lean(),
  ]);
  const branchNames = new Map(branches.map((branch) => [branch._id.toString(), branch.name])); const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  const lowStock = balances.filter((balance) => { const product = productMap.get(balance.productId.toString()); return product && balance.quantity <= product.reorderLevel; }).map((balance) => { const product = productMap.get(balance.productId.toString())!; return { branchId: balance.branchId.toString(), branchName: branchNames.get(balance.branchId.toString()) ?? 'Branch', productId: product._id.toString(), name: product.name, sku: product.sku, unit: product.unit, quantity: balance.quantity, reorderLevel: product.reorderLevel }; }).sort((a, b) => a.quantity - b.quantity).slice(0, 50);
  response.json({ from, to, daily, topProducts: topProducts.map((item) => ({ ...item, productId: item.productId.toString() })), payments, lowStock });
} catch (error) { next(error); } };
