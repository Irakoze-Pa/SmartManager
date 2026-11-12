import type { RequestHandler } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { SaleModel } from '../sales/sale.model.js';
import { CustomerModel } from './customer.model.js';

const customerInput = z.object({ name: z.string().trim().min(2).max(140), phone: z.string().trim().max(40).default(''), email: z.union([z.literal(''), z.email()]).default(''), notes: z.string().trim().max(500).default('') });
const creditPaymentInput = z.object({ amount: z.coerce.number().positive().max(1_000_000_000), method: z.enum(['cash', 'mtn_momo', 'airtel_money', 'card', 'bank_transfer']) });
const auth = (request: Express.Request) => { if (!request.auth) throw new ApiError(401, 'Authentication is required'); return request.auth; };

export const listCustomers: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request);
  const customers = await CustomerModel.find({ businessId: tenant.businessId }).sort({ name: 1 }).lean();
  const stats = await SaleModel.aggregate<{ _id: Types.ObjectId; visits: number; totalSpent: number; creditBalance: number; lastPurchaseAt: Date }>([
    { $match: { businessId: new Types.ObjectId(tenant.businessId), customerId: { $exists: true }, status: 'completed' } },
    { $group: { _id: '$customerId', visits: { $sum: 1 }, totalSpent: { $sum: '$total' }, creditBalance: { $sum: { $ifNull: ['$balanceDue', 0] } }, lastPurchaseAt: { $max: '$createdAt' } } },
  ]);
  const statsById = new Map(stats.map((item) => [item._id.toString(), item]));
  response.json({ items: customers.map((customer) => { const activity = statsById.get(customer._id.toString()); return { id: customer._id.toString(), name: customer.name, phone: customer.phone, email: customer.email, notes: customer.notes, isActive: customer.isActive, visits: activity?.visits ?? 0, totalSpent: activity?.totalSpent ?? 0, creditBalance: activity?.creditBalance ?? 0, ...(activity?.lastPurchaseAt ? { lastPurchaseAt: activity.lastPurchaseAt } : {}) }; }) });
} catch (error) { next(error); } };

export const createCustomer: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = customerInput.safeParse(request.body);
  if (!parsed.success) throw new ApiError(422, 'Customer details are invalid', parsed.error.flatten().fieldErrors);
  const customer = await CustomerModel.create({ businessId: tenant.businessId, ...parsed.data });
  response.status(201).json({ customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, notes: customer.notes, isActive: customer.isActive, visits: 0, totalSpent: 0, creditBalance: 0 } });
} catch (error) { next(error); } };

export const setCustomerStatus: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = z.object({ isActive: z.boolean() }).safeParse(request.body);
  if (!parsed.success || !isValidObjectId(request.params.customerId)) throw new ApiError(422, 'Customer status is invalid');
  const customer = await CustomerModel.findOneAndUpdate({ _id: request.params.customerId, businessId: tenant.businessId }, { isActive: parsed.data.isActive }, { new: true });
  if (!customer) throw new ApiError(404, 'Customer was not found');
  response.json({ customer: { id: customer.id, isActive: customer.isActive } });
} catch (error) { next(error); } };

export const recordCreditPayment: RequestHandler = async (request, response, next) => { try {
  const tenant = auth(request); const parsed = creditPaymentInput.safeParse(request.body);
  if (!parsed.success || !isValidObjectId(request.params.customerId)) throw new ApiError(422, 'Payment details are invalid');
  const customer = await CustomerModel.findOne({ _id: request.params.customerId, businessId: tenant.businessId, isActive: true }).lean();
  if (!customer) throw new ApiError(404, 'Customer was not found');
  const sales = await SaleModel.find({ businessId: tenant.businessId, customerId: customer._id, status: 'completed', balanceDue: { $gt: 0 } }).sort({ createdAt: 1 });
  const outstanding = sales.reduce((sum, sale) => sum + sale.balanceDue, 0);
  if (outstanding <= 0) throw new ApiError(409, 'This customer has no outstanding credit');
  if (parsed.data.amount > outstanding) throw new ApiError(422, 'Payment cannot be greater than the outstanding credit');
  let remaining = parsed.data.amount;
  for (const sale of sales) {
    if (remaining <= 0) break;
    const applied = Math.min(remaining, sale.balanceDue);
    sale.amountPaid = Math.round((sale.amountPaid + applied) * 100) / 100;
    sale.balanceDue = Math.round((sale.balanceDue - applied) * 100) / 100;
    sale.paymentStatus = sale.balanceDue === 0 ? 'paid' : 'partial';
    sale.creditPayments.push({ amount: applied, method: parsed.data.method, receivedBy: new Types.ObjectId(tenant.userId), receivedAt: new Date() });
    await sale.save();
    remaining = Math.round((remaining - applied) * 100) / 100;
  }
  response.status(201).json({ payment: { amount: parsed.data.amount, method: parsed.data.method, balanceDue: Math.round((outstanding - parsed.data.amount) * 100) / 100 } });
} catch (error) { next(error); } };
