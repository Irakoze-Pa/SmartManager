import type { Request, RequestHandler } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { BranchModel } from '../branches/branch.model.js';
import { SaleModel } from '../sales/sale.model.js';
import { BusinessModel } from '../businesses/business.model.js';
import { DryCleaningOrderModel } from '../dry-cleaning/dry-cleaning.model.js';
import { UserModel } from '../users/user.model.js';
import { ExpenseModel, expenseCategories } from './expense.model.js';

const expenseInput = z.object({ branchId: z.string().refine(isValidObjectId), category: z.enum(expenseCategories), description: z.string().trim().min(3).max(250), amount: z.coerce.number().positive().max(1_000_000_000), incurredAt: z.coerce.date() });
const auth = (request: Express.Request) => { if (!request.auth) throw new ApiError(401, 'Authentication is required'); return request.auth; };
const requireBranch = async (tenant: ReturnType<typeof auth>, branchId: string) => {
  const branch = await BranchModel.findOne({ _id: branchId, businessId: tenant.businessId, isActive: true }).lean();
  if (!branch) throw new ApiError(422, 'Select an active branch in this business');
  if (tenant.role !== 'owner' && tenant.role !== 'admin') { const user = await UserModel.findById(tenant.userId).select('branchIds').lean(); if (!user?.branchIds.some((id) => id.toString() === branchId)) throw new ApiError(403, 'You do not have access to this branch'); }
};
const branchScope = async (tenant: ReturnType<typeof auth>, requested?: string) => {
  if (requested && !isValidObjectId(requested)) throw new ApiError(422, 'Finance branch is invalid');
  if (requested) await requireBranch(tenant, requested);
  if (tenant.role === 'owner' || tenant.role === 'admin') return requested ? [requested] : undefined;
  const user = await UserModel.findById(tenant.userId).select('branchIds').lean();
  if (!user) throw new ApiError(401, 'User account is unavailable');
  const accessible = user.branchIds.map((id) => id.toString());
  if (requested && !accessible.includes(requested)) throw new ApiError(403, 'You do not have access to this branch');
  return requested ? [requested] : accessible;
};
const period = (request: Request) => { const now = new Date(); const fallback = new Date(now.getFullYear(), now.getMonth(), 1); const from = typeof request.query.from === 'string' ? new Date(`${request.query.from}T00:00:00.000`) : fallback; const to = typeof request.query.to === 'string' ? new Date(`${request.query.to}T23:59:59.999`) : now; if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new ApiError(422, 'Finance date range is invalid'); return { from, to }; };

export const financeSummary: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const { from, to } = period(request); const requestedBranch = typeof request.query.branchId === 'string' ? request.query.branchId : undefined; const branchIds = await branchScope(tenant, requestedBranch);
  const businessId = new Types.ObjectId(tenant.businessId); const branchFilter = branchIds ? { branchId: branchIds.length === 1 ? new Types.ObjectId(branchIds[0]) : { $in: branchIds.map((id) => new Types.ObjectId(id)) } } : {};
  const business = await BusinessModel.findById(businessId).select('industry').lean();
  const sales = business?.industry === 'dry_cleaning'
    ? (await DryCleaningOrderModel.aggregate<{ revenue: number; transactions: number }>([
      { $match: { businessId, status: 'picked_up', ...branchFilter, $expr: { $and: [{ $gte: [{ $ifNull: ['$pickedUpAt', '$updatedAt'] }, from] }, { $lte: [{ $ifNull: ['$pickedUpAt', '$updatedAt'] }, to] }] } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, transactions: { $sum: 1 } } },
    ]))[0]
    : (await SaleModel.aggregate<{ revenue: number; cogs: number; transactions: number }>([
      { $match: { businessId, status: 'completed', createdAt: { $gte: from, $lte: to }, ...branchFilter } },
      { $group: {
        _id: null,
        revenue: { $sum: '$total' },
        cogs: { $sum: { $sum: { $map: { input: '$items', as: 'item', in: { $multiply: [{ $ifNull: ['$$item.stockQuantity', '$$item.quantity'] }, { $ifNull: ['$$item.unitCost', 0] }] } } } } },
        transactions: { $sum: 1 },
      } },
    ]))[0];
  const [expenses] = await ExpenseModel.aggregate<{ total: number }>([{ $match: { businessId, incurredAt: { $gte: from, $lte: to }, ...branchFilter } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const revenue = sales?.revenue ?? 0; const cogs = business?.industry === 'dry_cleaning' ? 0 : sales && 'cogs' in sales ? Number(sales.cogs) : 0; const operatingExpenses = expenses?.total ?? 0; const grossProfit = revenue - cogs;
  response.json({ from, to, industry: business?.industry ?? 'retail', revenue, cogs, grossProfit, operatingExpenses, netProfit: grossProfit - operatingExpenses, transactions: sales?.transactions ?? 0 });
} catch (error) { next(error); } };

export const listExpenses: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const { from, to } = period(request); const requestedBranch = typeof request.query.branchId === 'string' ? request.query.branchId : undefined; const branchIds = await branchScope(tenant, requestedBranch);
  const items = await ExpenseModel.find({ businessId: tenant.businessId, incurredAt: { $gte: from, $lte: to }, ...(branchIds ? { branchId: branchIds.length === 1 ? branchIds[0] : { $in: branchIds } } : {}) }).sort({ incurredAt: -1 }).limit(200).populate('branchId', 'name').lean();
  response.json({ items: items.map((item) => ({ id: item._id.toString(), branchId: String((item.branchId as unknown as { _id: unknown })._id), branchName: (item.branchId as unknown as { name: string }).name, category: item.category, description: item.description, amount: item.amount, incurredAt: item.incurredAt })) });
} catch (error) { next(error); } };

export const createExpense: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = expenseInput.safeParse(request.body); if (!parsed.success) throw new ApiError(422, 'Expense details are invalid', parsed.error.flatten().fieldErrors); await requireBranch(tenant, parsed.data.branchId);
  const expense = await ExpenseModel.create({ businessId: tenant.businessId, recordedBy: tenant.userId, ...parsed.data }); response.status(201).json({ expense: { id: expense.id, category: expense.category, description: expense.description, amount: expense.amount, incurredAt: expense.incurredAt } });
} catch (error) { next(error); } };
