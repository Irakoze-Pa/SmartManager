import type { RequestHandler } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { BusinessModel } from '../businesses/business.model.js';
import { BranchModel } from '../branches/branch.model.js';
import { ProductModel } from '../catalog/product.model.js';
import { InventoryAdjustmentModel } from '../inventory/inventory-adjustment.model.js';
import { InventoryBalanceModel } from '../inventory/inventory-balance.model.js';
import { ProductionOrderModel } from './production-order.model.js';
import { BillOfMaterialsModel } from './bill-of-materials.model.js';
import { AccountModel, JournalEntryModel, TenantAuditModel } from '../accounting/accounting.model.js';
import { isValidObjectId, Types } from 'mongoose';

const productionSchema = z.object({ branchId: z.string().min(1), finishedProductId: z.string().min(1), finishedQuantity: z.coerce.number().positive(), reference: z.string().trim().min(2).max(60), notes: z.string().trim().max(250).optional().default(''), materials: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive() })).min(1).max(50) }).refine((value) => new Set(value.materials.map((material) => material.productId)).size === value.materials.length, { message: 'Each material can only appear once' });
const recipeSchema = z.object({ name: z.string().trim().min(2).max(100), finishedProductId: z.string().min(1), outputQuantity: z.coerce.number().positive(), notes: z.string().trim().max(250).optional().default(''), materials: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive() })).min(1).max(50) }).refine((value) => new Set(value.materials.map((material) => material.productId)).size === value.materials.length, { message: 'Each material can only appear once' });
const planSchema = z.object({ branchId: z.string().min(1), recipeId: z.string().min(1), finishedQuantity: z.coerce.number().positive(), reference: z.string().trim().min(2).max(60), notes: z.string().trim().max(250).optional().default('') });
const completionSchema = z.object({ actualQuantity: z.coerce.number().positive(), acceptedQuantity: z.coerce.number().nonnegative(), extraCost: z.coerce.number().nonnegative().default(0), qualityNotes: z.string().trim().max(250).optional().default('') }).refine((value) => value.acceptedQuantity <= value.actualQuantity, { message: 'Accepted quantity cannot exceed actual production' });
const stageSchema = z.object({ status: z.enum(['in_progress', 'quality_check']), note: z.string().trim().max(250).optional().default('') });
const auth = (request: Express.Request) => { if (!request.auth) throw new ApiError(401, 'Authentication is required'); return request.auth; };
const ensureManufacturer = async (businessId: string) => { const business = await BusinessModel.findById(businessId).select('industry').lean(); if (business?.industry !== 'manufacturing') throw new ApiError(403, 'Production is only available to manufacturing businesses'); };

export const listProductionOrders: RequestHandler = async (request, response, next) => {
  try {
    const tenant = auth(request); await ensureManufacturer(tenant.businessId);
    const orders = await ProductionOrderModel.find({ businessId: tenant.businessId }).sort({ createdAt: -1 }).limit(100).populate('finishedProductId', 'name sku unit').populate('materials.productId', 'name sku unit').populate('branchId', 'name').lean();
    response.json({ items: orders.map((order) => ({ id: order._id.toString(), branchId: order.branchId.toString(), reference: order.reference, branchName: (order.branchId as unknown as { name?: string })?.name ?? '', finishedProduct: order.finishedProductId as unknown, finishedQuantity: order.finishedQuantity, materials: order.materials, notes: order.notes, status: order.status, stageHistory: order.stageHistory, estimatedMaterialCost: order.estimatedMaterialCost, actualMaterialCost: order.actualMaterialCost, extraCost: order.extraCost, actualQuantity: order.actualQuantity, acceptedQuantity: order.acceptedQuantity, rejectedQuantity: order.rejectedQuantity, qualityStatus: order.qualityStatus, qualityNotes: order.qualityNotes, createdAt: order.createdAt })) });
  } catch (error) { next(error); }
};

export const productionReport: RequestHandler = async (request, response, next) => {
  try {
    const tenant = auth(request); await ensureManufacturer(tenant.businessId);
    const from = typeof request.query.from === 'string' ? new Date(`${request.query.from}T00:00:00.000`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = typeof request.query.to === 'string' ? new Date(`${request.query.to}T23:59:59.999`) : new Date();
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new ApiError(422, 'Production report date range is invalid');
    const filter: Record<string, unknown> = { businessId: tenant.businessId, status: 'completed', updatedAt: { $gte: from, $lte: to } };
    if (typeof request.query.branchId === 'string') {
      if (!isValidObjectId(request.query.branchId)) throw new ApiError(422, 'Report branch is invalid');
      const branch = await BranchModel.exists({ _id: request.query.branchId, businessId: tenant.businessId, isActive: true }); if (!branch) throw new ApiError(422, 'Report branch is not active in this business'); filter.branchId = request.query.branchId;
    }
    const orders = await ProductionOrderModel.find(filter).select('reference finishedProductId finishedQuantity actualQuantity acceptedQuantity rejectedQuantity estimatedMaterialCost actualMaterialCost extraCost qualityStatus stageHistory updatedAt').populate('finishedProductId', 'name sku unit').sort({ updatedAt: -1 }).limit(1000).lean();
    const actual = orders.reduce((sum, order) => sum + (order.actualQuantity ?? 0), 0); const accepted = orders.reduce((sum, order) => sum + (order.acceptedQuantity ?? 0), 0); const rejected = orders.reduce((sum, order) => sum + (order.rejectedQuantity ?? 0), 0);
    const cycleHours = orders.flatMap((order) => { const start = order.stageHistory.find((stage) => stage.status === 'planned')?.changedAt; const end = order.stageHistory.find((stage) => stage.status === 'completed')?.changedAt; return start && end ? [(end.getTime() - start.getTime()) / 3_600_000] : []; });
    const byDay = new Map<string, { date: string; orders: number; accepted: number; rejected: number }>();
    for (const order of orders) { const date = order.updatedAt.toISOString().slice(0, 10); const day = byDay.get(date) ?? { date, orders: 0, accepted: 0, rejected: 0 }; day.orders += 1; day.accepted += order.acceptedQuantity ?? 0; day.rejected += order.rejectedQuantity ?? 0; byDay.set(date, day); }
    response.json({ from, to, summary: { completedOrders: orders.length, plannedOutput: orders.reduce((sum, order) => sum + order.finishedQuantity, 0), actualOutput: actual, acceptedOutput: accepted, rejectedOutput: rejected, yieldPercent: actual ? Number((accepted / actual * 100).toFixed(1)) : 0, estimatedMaterialCost: orders.reduce((sum, order) => sum + order.estimatedMaterialCost, 0), actualProductionCost: orders.reduce((sum, order) => sum + (order.actualMaterialCost ?? 0) + (order.extraCost ?? 0), 0), averageCycleHours: cycleHours.length ? Number((cycleHours.reduce((sum, hours) => sum + hours, 0) / cycleHours.length).toFixed(1)) : 0 }, daily: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)), quality: orders.map((order) => ({ reference: order.reference, product: order.finishedProductId as unknown, actualQuantity: order.actualQuantity ?? 0, acceptedQuantity: order.acceptedQuantity ?? 0, rejectedQuantity: order.rejectedQuantity ?? 0, status: order.qualityStatus, completedAt: order.updatedAt })) });
  } catch (error) { next(error); }
};

export const listRecipes: RequestHandler = async (request, response, next) => {
  try { const tenant = auth(request); await ensureManufacturer(tenant.businessId); const items = await BillOfMaterialsModel.find({ businessId: tenant.businessId, isActive: true }).sort({ name: 1 }).populate('finishedProductId', 'name sku unit').populate('materials.productId', 'name sku unit').lean(); response.json({ items: items.map((item) => ({ id: item._id.toString(), name: item.name, finishedProduct: item.finishedProductId as unknown, outputQuantity: item.outputQuantity, materials: item.materials, notes: item.notes })) }); } catch (error) { next(error); }
};

export const createRecipe: RequestHandler = async (request, response, next) => {
  try {
    const tenant = auth(request); await ensureManufacturer(tenant.businessId); const parsed = recipeSchema.safeParse(request.body); if (!parsed.success) throw new ApiError(422, 'Bill of materials is invalid', parsed.error.flatten().fieldErrors); const input = parsed.data;
    if (input.materials.some((item) => item.productId === input.finishedProductId)) throw new ApiError(422, 'Finished product cannot also be a material');
    const ids = [input.finishedProductId, ...input.materials.map((item) => item.productId)]; const products = await ProductModel.find({ _id: { $in: ids }, businessId: tenant.businessId, isActive: true }).select('_id').lean(); if (products.length !== ids.length) throw new ApiError(422, 'Select active products in this business');
    const recipe = await BillOfMaterialsModel.create({ businessId: tenant.businessId, ...input }); response.status(201).json({ id: recipe._id.toString() });
  } catch (error) { if ((error as { code?: number })?.code === 11000) return next(new ApiError(409, 'A bill of materials with this name already exists')); next(error); }
};

export const createPlannedOrder: RequestHandler = async (request, response, next) => {
  try {
    const tenant = auth(request); await ensureManufacturer(tenant.businessId); const parsed = planSchema.safeParse(request.body); if (!parsed.success) throw new ApiError(422, 'Work order is invalid', parsed.error.flatten().fieldErrors); const input = parsed.data;
    const [branch, recipe] = await Promise.all([BranchModel.findOne({ _id: input.branchId, businessId: tenant.businessId, isActive: true }).lean(), BillOfMaterialsModel.findOne({ _id: input.recipeId, businessId: tenant.businessId, isActive: true }).lean()]);
    if (!branch || !recipe) throw new ApiError(422, 'Select an active branch and bill of materials');
    const scale = input.finishedQuantity / recipe.outputQuantity; const recipeMaterials = recipe.materials.map((item) => ({ productId: item.productId.toString(), quantity: item.quantity * scale }));
    const materialProducts = await ProductModel.find({ _id: { $in: recipeMaterials.map((item) => item.productId) }, businessId: tenant.businessId }).select('_id costPrice').lean();
    const costs = new Map(materialProducts.map((product) => [product._id.toString(), product.costPrice]));
    const materials = recipeMaterials.map((item) => ({ ...item, unitCost: costs.get(item.productId) ?? 0 })); const estimatedMaterialCost = materials.reduce((total, item) => total + item.quantity * item.unitCost, 0);
    const order = await ProductionOrderModel.create({ businessId: tenant.businessId, branchId: input.branchId, recipeId: recipe._id, finishedProductId: recipe.finishedProductId, finishedQuantity: input.finishedQuantity, materials, estimatedMaterialCost, reference: input.reference, notes: input.notes, userId: tenant.userId, status: 'planned', stageHistory: [{ status: 'planned', note: '', userId: tenant.userId, changedAt: new Date() }] });
    response.status(201).json({ id: order._id.toString(), reference: order.reference });
  } catch (error) { if ((error as { code?: number })?.code === 11000) return next(new ApiError(409, 'A work order with this reference already exists')); next(error); }
};

export const updateOrderStage: RequestHandler = async (request, response, next) => {
  try {
    const tenant = auth(request); await ensureManufacturer(tenant.businessId); const parsed = stageSchema.safeParse(request.body); if (!parsed.success) throw new ApiError(422, 'Production stage update is invalid', parsed.error.flatten().fieldErrors);
    const order = await ProductionOrderModel.findOne({ _id: request.params.orderId, businessId: tenant.businessId }); if (!order) throw new ApiError(404, 'Work order was not found');
    const allowed = order.status === 'planned' && parsed.data.status === 'in_progress' || order.status === 'in_progress' && parsed.data.status === 'quality_check';
    if (!allowed) throw new ApiError(409, 'Work order must move from planned to in progress, then to quality check');
    order.status = parsed.data.status; order.stageHistory.push({ status: parsed.data.status, note: parsed.data.note, userId: tenant.userId, changedAt: new Date() }); await order.save();
    response.json({ id: order._id.toString(), status: order.status });
  } catch (error) { next(error); }
};

export const completePlannedOrder: RequestHandler = async (request, response, next) => {
  const tenant = auth(request); const movements: Array<{ branchId: string; productId: string; change: number; before: number; after: number }> = [];
  try {
    await ensureManufacturer(tenant.businessId); const parsed = completionSchema.safeParse(request.body); if (!parsed.success) throw new ApiError(422, 'Production completion details are invalid', parsed.error.flatten().fieldErrors); const input = parsed.data; const order = await ProductionOrderModel.findOne({ _id: request.params.orderId, businessId: tenant.businessId, status: 'quality_check' }); if (!order) throw new ApiError(409, 'Move this work order through production and quality check before completing it');
    if (input.acceptedQuantity > order.finishedQuantity) throw new ApiError(422, 'Accepted quantity cannot exceed the planned quantity');
    for (const material of order.materials) { const quantity = material.quantity; const productId = material.productId.toString(); const balance = await InventoryBalanceModel.findOneAndUpdate({ businessId: tenant.businessId, branchId: order.branchId, productId, quantity: { $gte: quantity } }, { $inc: { quantity: -quantity } }, { new: true }); if (!balance) throw new ApiError(409, 'Insufficient stock for one or more materials'); movements.push({ branchId: order.branchId.toString(), productId, change: -quantity, before: balance.quantity + quantity, after: balance.quantity }); }
    const outputQuantity = input.acceptedQuantity; const finishedProductId = order.finishedProductId.toString(); if (outputQuantity > 0) { const output = await InventoryBalanceModel.findOneAndUpdate({ businessId: tenant.businessId, branchId: order.branchId, productId: finishedProductId }, { $inc: { quantity: outputQuantity }, $setOnInsert: { businessId: tenant.businessId, branchId: order.branchId, productId: finishedProductId } }, { upsert: true, new: true }); movements.push({ branchId: order.branchId.toString(), productId: finishedProductId, change: outputQuantity, before: output.quantity - outputQuantity, after: output.quantity }); }
    const actualMaterialCost = order.materials.reduce((total, material) => total + material.quantity * material.unitCost, 0);
    if (actualMaterialCost > 0) {
      const businessId = new Types.ObjectId(tenant.businessId);
      const productionAccounts = [
        { code: '1200', name: 'Finished goods inventory', type: 'asset', normalBalance: 'debit', systemKey: 'inventory' },
        { code: '1210', name: 'Raw materials inventory', type: 'asset', normalBalance: 'debit', systemKey: 'raw_materials_inventory' },
        { code: '5100', name: 'Production quality loss', type: 'expense', normalBalance: 'debit', systemKey: 'production_quality_loss' },
      ] as const;
      await Promise.all(productionAccounts.map((account) => AccountModel.updateOne({ businessId, code: account.code }, { $setOnInsert: { businessId, ...account } }, { upsert: true })));
      const [rawMaterials, finishedGoods, qualityLoss] = await Promise.all([
        AccountModel.findOne({ businessId, code: '1210', isActive: true }).lean(),
        AccountModel.findOne({ businessId, code: '1200', isActive: true }).lean(),
        AccountModel.findOne({ businessId, code: '5100', isActive: true }).lean(),
      ]);
      if (!rawMaterials || !finishedGoods || !qualityLoss) throw new ApiError(409, 'Production ledger accounts could not be prepared');
      const count = await JournalEntryModel.countDocuments({ businessId });
      const acceptedCost = Number((actualMaterialCost * (input.actualQuantity ? input.acceptedQuantity / input.actualQuantity : 0)).toFixed(2));
      const lossCost = Number((actualMaterialCost - acceptedCost).toFixed(2));
      const lines = [
        ...(acceptedCost > 0 ? [{ accountId: finishedGoods._id, accountCode: finishedGoods.code, accountName: finishedGoods.name, description: `Accepted output · ${order.reference}`, debit: acceptedCost, credit: 0, branchId: order.branchId }] : []),
        ...(lossCost > 0 ? [{ accountId: qualityLoss._id, accountCode: qualityLoss.code, accountName: qualityLoss.name, description: `Rejected production material · ${order.reference}`, debit: lossCost, credit: 0, branchId: order.branchId }] : []),
        { accountId: rawMaterials._id, accountCode: rawMaterials.code, accountName: rawMaterials.name, description: `Materials consumed · ${order.reference}`, debit: 0, credit: actualMaterialCost, branchId: order.branchId },
      ];
      await JournalEntryModel.create({ businessId, journalNumber: `JE-${String(count + 1).padStart(6, '0')}`, date: new Date(), description: `Production completion · ${order.reference}`, sourceType: 'manufacturing_production', sourceId: order._id, status: 'posted', createdBy: tenant.userId, lines });
      await TenantAuditModel.create({ businessId, userId: tenant.userId, action: 'post', entityType: 'manufacturing_journal', entityId: order._id, metadata: { materialCost: actualMaterialCost, acceptedCost, lossCost } });
    }
    order.status = 'completed'; order.stageHistory.push({ status: 'completed', note: input.qualityNotes, userId: tenant.userId, changedAt: new Date() }); order.actualQuantity = input.actualQuantity; order.acceptedQuantity = input.acceptedQuantity; order.rejectedQuantity = input.actualQuantity - input.acceptedQuantity; order.actualMaterialCost = actualMaterialCost; order.extraCost = input.extraCost; order.qualityStatus = input.acceptedQuantity === 0 ? 'failed' : input.acceptedQuantity < input.actualQuantity ? 'partial' : 'passed'; order.qualityNotes = input.qualityNotes; await order.save(); await InventoryAdjustmentModel.insertMany(movements.map((movement) => ({ businessId: tenant.businessId, branchId: movement.branchId, productId: movement.productId, userId: tenant.userId, change: movement.change, quantityBefore: movement.before, quantityAfter: movement.after, reason: `Production ${order.reference}` })));
    response.json({ id: order._id.toString(), status: order.status, qualityStatus: order.qualityStatus });
  } catch (error) { for (const movement of movements.reverse()) await InventoryBalanceModel.updateOne({ businessId: tenant.businessId, branchId: movement.branchId, productId: movement.productId, quantity: { $gte: Math.max(0, movement.change) } }, { $inc: { quantity: -movement.change } }).catch(() => undefined); next(error); }
};

export const createProductionOrder: RequestHandler = async (request, response, next) => {
  const tenant = auth(request); const movements: Array<{ branchId: string; productId: string; change: number; before: number; after: number }> = [];
  try {
    await ensureManufacturer(tenant.businessId);
    const parsed = productionSchema.safeParse(request.body); if (!parsed.success) throw new ApiError(422, 'Production record is invalid', parsed.error.flatten().fieldErrors);
    const input = parsed.data;
    if (input.materials.some((item) => item.productId === input.finishedProductId)) throw new ApiError(422, 'Finished product cannot also be a consumed material');
    const branch = await BranchModel.findOne({ _id: input.branchId, businessId: tenant.businessId, isActive: true }).lean(); if (!branch) throw new ApiError(422, 'Select an active branch in this business');
    const productIds = [input.finishedProductId, ...input.materials.map((item) => item.productId)];
    const products = await ProductModel.find({ _id: { $in: productIds }, businessId: tenant.businessId, isActive: true }).select('_id').lean();
    if (products.length !== productIds.length) throw new ApiError(422, 'Select active products in this business');
    for (const material of input.materials) {
      const filter = { businessId: tenant.businessId, branchId: input.branchId, productId: material.productId, quantity: { $gte: material.quantity } };
      const balance = await InventoryBalanceModel.findOneAndUpdate(filter, { $inc: { quantity: -material.quantity } }, { new: true });
      if (!balance) throw new ApiError(409, 'Insufficient stock for one or more materials');
      movements.push({ branchId: input.branchId, productId: material.productId, change: -material.quantity, before: balance.quantity + material.quantity, after: balance.quantity });
    }
    const outputBalance = await InventoryBalanceModel.findOneAndUpdate({ businessId: tenant.businessId, branchId: input.branchId, productId: input.finishedProductId }, { $inc: { quantity: input.finishedQuantity }, $setOnInsert: { businessId: tenant.businessId, branchId: input.branchId, productId: input.finishedProductId } }, { new: true, upsert: true });
    movements.push({ branchId: input.branchId, productId: input.finishedProductId, change: input.finishedQuantity, before: outputBalance.quantity - input.finishedQuantity, after: outputBalance.quantity });
    const order = await ProductionOrderModel.create({ businessId: tenant.businessId, branchId: input.branchId, finishedProductId: input.finishedProductId, finishedQuantity: input.finishedQuantity, materials: input.materials, reference: input.reference, notes: input.notes, userId: tenant.userId });
    await InventoryAdjustmentModel.insertMany(movements.map((movement) => ({ businessId: tenant.businessId, branchId: movement.branchId, productId: movement.productId, userId: tenant.userId, change: movement.change, quantityBefore: movement.before, quantityAfter: movement.after, reason: `Production ${input.reference}` })));
    response.status(201).json({ id: order._id.toString(), reference: order.reference });
  } catch (error) {
    for (const movement of movements.reverse()) {
      await InventoryBalanceModel.updateOne({ businessId: tenant.businessId, branchId: movement.branchId, productId: movement.productId, quantity: { $gte: Math.max(0, movement.change) } }, { $inc: { quantity: -movement.change } }).catch(() => undefined);
    }
    next(error);
  }
};
