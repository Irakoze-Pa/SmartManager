import type { RequestHandler } from 'express';
import { isValidObjectId, startSession, type ClientSession } from 'mongoose';
import { z } from 'zod';
import { getDatabaseTarget } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { BranchModel } from '../branches/branch.model.js';
import { ProductModel } from '../catalog/product.model.js';
import { UserModel } from '../users/user.model.js';
import { InventoryAdjustmentModel } from './inventory-adjustment.model.js';
import { InventoryBalanceModel } from './inventory-balance.model.js';
import { InventoryTransferModel } from './inventory-transfer.model.js';

const input = z.object({ fromBranchId: z.string().refine(isValidObjectId), toBranchId: z.string().refine(isValidObjectId), items: z.array(z.object({ productId: z.string().refine(isValidObjectId), quantity: z.coerce.number().positive().max(1_000_000) })).min(1).max(100), note: z.string().trim().max(250).default('') }).refine((value) => value.fromBranchId !== value.toBranchId, { message: 'Source and destination branches must differ', path: ['toBranchId'] });
const auth = (request: Express.Request) => { if (!request.auth) throw new ApiError(401, 'Authentication is required'); return request.auth; };
const accessible = async (tenant: ReturnType<typeof auth>, ids: string[]) => { const branches = await BranchModel.find({ _id: { $in: ids }, businessId: tenant.businessId, isActive: true }).lean(); if (branches.length !== ids.length) throw new ApiError(422, 'Select two active branches in this business'); if (tenant.role !== 'owner' && tenant.role !== 'admin') { const user = await UserModel.findById(tenant.userId).select('branchIds').lean(); const allowed = new Set(user?.branchIds.map((id) => id.toString()) ?? []); if (ids.some((id) => !allowed.has(id))) throw new ApiError(403, 'You do not have access to both branches'); } return branches; };

export const listTransfers: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const transfers = await InventoryTransferModel.find({ businessId: tenant.businessId }).sort({ createdAt: -1 }).limit(100).populate('fromBranchId', 'name').populate('toBranchId', 'name').lean();
  response.json({ items: transfers.map((item) => ({ id: item._id.toString(), transferNumber: item.transferNumber, fromBranchName: (item.fromBranchId as unknown as { name: string }).name, toBranchName: (item.toBranchId as unknown as { name: string }).name, items: item.items.map((line) => ({ productId: line.productId.toString(), name: line.name, sku: line.sku, quantity: line.quantity })), note: item.note, status: item.status, createdAt: item.createdAt })) });
} catch (error) { next(error); } };

export const createTransfer: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = input.safeParse(request.body); if (!parsed.success) throw new ApiError(422, 'Stock transfer details are invalid', parsed.error.flatten().fieldErrors);
  await accessible(tenant, [parsed.data.fromBranchId, parsed.data.toBranchId]);
  const quantities = new Map<string, number>(); for (const item of parsed.data.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  const products = await ProductModel.find({ _id: { $in: [...quantities.keys()] }, businessId: tenant.businessId, isActive: true }).lean(); if (products.length !== quantities.size) throw new ApiError(422, 'One or more products are unavailable');
  const items = products.map((product) => ({ productId: product._id, name: product.name, sku: product.sku, quantity: quantities.get(product._id.toString())! })); const transferNumber = `TR-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const apply = async (session?: ClientSession) => {
    const moved: Array<{ productId: string; quantity: number; sourceBefore: number; destinationBefore: number }> = [];
    try {
      for (const item of items) { const source = await InventoryBalanceModel.findOneAndUpdate({ businessId: tenant.businessId, branchId: parsed.data.fromBranchId, productId: item.productId, quantity: { $gte: item.quantity } }, { $inc: { quantity: -item.quantity } }, { new: false, ...(session ? { session } : {}) }); if (!source) throw new ApiError(409, `Insufficient stock for ${item.name}`); const destination = await InventoryBalanceModel.findOneAndUpdate({ businessId: tenant.businessId, branchId: parsed.data.toBranchId, productId: item.productId }, { $inc: { quantity: item.quantity }, $setOnInsert: { businessId: tenant.businessId, branchId: parsed.data.toBranchId, productId: item.productId } }, { upsert: true, new: true, ...(session ? { session } : {}) }); moved.push({ productId: item.productId.toString(), quantity: item.quantity, sourceBefore: source.quantity, destinationBefore: destination.quantity - item.quantity }); }
      const [transfer] = await InventoryTransferModel.create([{ businessId: tenant.businessId, fromBranchId: parsed.data.fromBranchId, toBranchId: parsed.data.toBranchId, transferredBy: tenant.userId, transferNumber, items, note: parsed.data.note }], session ? { session } : {}); if (!transfer) throw new ApiError(500, 'Transfer record was not created');
      const adjustments = moved.flatMap((item) => [{ businessId: tenant.businessId, branchId: parsed.data.fromBranchId, productId: item.productId, userId: tenant.userId, change: -item.quantity, quantityBefore: item.sourceBefore, quantityAfter: item.sourceBefore - item.quantity, reason: `Stock transfer ${transferNumber} out` }, { businessId: tenant.businessId, branchId: parsed.data.toBranchId, productId: item.productId, userId: tenant.userId, change: item.quantity, quantityBefore: item.destinationBefore, quantityAfter: item.destinationBefore + item.quantity, reason: `Stock transfer ${transferNumber} in` }]); await InventoryAdjustmentModel.insertMany(adjustments, session ? { session } : {}); return transfer;
    } catch (error) { if (!session) await Promise.allSettled(moved.flatMap((item) => [InventoryBalanceModel.updateOne({ businessId: tenant.businessId, branchId: parsed.data.fromBranchId, productId: item.productId }, { $inc: { quantity: item.quantity } }), InventoryBalanceModel.updateOne({ businessId: tenant.businessId, branchId: parsed.data.toBranchId, productId: item.productId }, { $inc: { quantity: -item.quantity } })])); throw error; }
  };
  let transfer; if (getDatabaseTarget() === 'atlas') { const session = await startSession(); try { await session.withTransaction(async () => { transfer = await apply(session); }); } finally { await session.endSession(); } } else transfer = await apply(); if (!transfer) throw new ApiError(500, 'Stock transfer did not complete'); response.status(201).json({ transfer: { id: transfer.id, transferNumber: transfer.transferNumber, status: transfer.status, createdAt: transfer.createdAt } });
} catch (error) { next(error); } };
