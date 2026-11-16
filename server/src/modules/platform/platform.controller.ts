import type { RequestHandler } from 'express';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { BranchModel } from '../branches/branch.model.js';
import { BusinessModel } from '../businesses/business.model.js';
import { UserModel } from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { PlatformAuditModel } from './platform-audit.model.js';
import { PlatformPaymentModel } from './platform-payment.model.js';
import { getPlatformAdmin, loginPlatformAdmin } from './platform-auth.service.js';
import { registerBusiness } from '../auth/auth.service.js';
import { registerSchema } from '../auth/auth.validation.js';

const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });
const statusSchema = z.object({ status: z.enum(['active', 'suspended']) });
const resetPasswordSchema = z.object({
  password: z.string().min(8).max(72).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
});
const subscriptionSchema = z.object({
  plan: z.enum(['trial', 'starter', 'growth', 'enterprise']),
  status: z.enum(['trialing', 'active', 'past_due', 'cancelled']),
  currentPeriodEnd: z.coerce.date(),
});
const paymentSchema = z.object({
  amount: z.coerce.number().int().positive().max(1_000_000_000_000),
  method: z.enum(['cash', 'mtn_momo', 'airtel_money', 'bank_transfer', 'card', 'other']),
  reference: z.string().trim().max(120).default(''),
  paidAt: z.coerce.date(),
  plan: z.enum(['trial', 'starter', 'growth', 'enterprise']),
  periodEnd: z.coerce.date(),
}).refine((payment) => payment.periodEnd > payment.paidAt, { path: ['periodEnd'], message: 'Coverage date must be after the payment date' });
const normalizeIndustry = (industry?: string): string => industry === 'clinic' ? 'building_materials' : industry ?? 'retail';

export const platformLogin: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Platform login details are invalid');
    response.json(await loginPlatformAdmin(parsed.data.email, parsed.data.password));
  } catch (error: unknown) { next(error); }
};

export const platformMe: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.platformAuth) throw new ApiError(401, 'Platform authentication is required');
    response.json({ admin: await getPlatformAdmin(request.platformAuth.adminId) });
  } catch (error: unknown) { next(error); }
};

export const createPlatformBusiness: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.platformAuth) throw new ApiError(401, 'Platform authentication is required');
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Company onboarding details are invalid', parsed.error.flatten().fieldErrors);
    const identity = await registerBusiness(parsed.data);
    await PlatformAuditModel.create({ adminId: request.platformAuth.adminId, action: 'business.created', targetType: 'business', targetId: identity.business.id, metadata: { ownerId: identity.user.id, ownerEmail: identity.user.email } });
    response.status(201).json({ business: identity.business, owner: identity.user, branch: identity.branch });
  } catch (error: unknown) { next(error); }
};

export const listBusinesses: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20));
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
    const status = request.query.status === 'active' || request.query.status === 'suspended' ? request.query.status : undefined;
    const plan = ['trial', 'starter', 'growth', 'enterprise'].includes(String(request.query.plan)) ? String(request.query.plan) : undefined;
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = {
      ...(status ? { status } : {}),
      ...(plan ? { 'subscription.plan': plan } : {}),
      ...(search ? { $or: ['name', 'slug', 'industry'].map((field) => ({ [field]: { $regex: escapedSearch, $options: 'i' } })) } : {}),
    };
    const [businesses, total] = await Promise.all([
      BusinessModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      BusinessModel.countDocuments(filter),
    ]);
    const items = await Promise.all(businesses.map(async (business) => {
      const [users, branches] = await Promise.all([UserModel.countDocuments({ businessId: business._id }), BranchModel.countDocuments({ businessId: business._id })]);
      const subscription = business.subscription ?? { plan: 'trial', status: 'trialing', startedAt: business.createdAt, currentPeriodEnd: new Date(new Date(business.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000) };
      return { id: business._id.toString(), name: business.name, slug: business.slug, industry: normalizeIndustry(business.industry), businessType: business.businessType ?? 'sole_trader', status: business.status, subscription, createdAt: business.createdAt, users, branches };
    }));
    response.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: unknown) { next(error); }
};

export const setBusinessStatus: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.platformAuth) throw new ApiError(401, 'Platform authentication is required');
    const parsed = statusSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Business status is invalid');
    const business = await BusinessModel.findByIdAndUpdate(request.params.businessId, { status: parsed.data.status }, { new: true });
    if (!business) throw new ApiError(404, 'Business was not found');
    await PlatformAuditModel.create({ adminId: request.platformAuth.adminId, action: 'business.status.updated', targetType: 'business', targetId: business.id, metadata: { status: business.status } });
    response.json({ business: { id: business.id, name: business.name, status: business.status } });
  } catch (error: unknown) { next(error); }
};

export const setBusinessSubscription: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.platformAuth) throw new ApiError(401, 'Platform authentication is required');
    const parsed = subscriptionSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Subscription details are invalid');
    const existing = await BusinessModel.findById(request.params.businessId).select('createdAt subscription');
    if (!existing) throw new ApiError(404, 'Business was not found');
    const startedAt = existing.subscription?.startedAt ?? existing.createdAt;
    const business = await BusinessModel.findByIdAndUpdate(existing._id, { subscription: { ...parsed.data, startedAt } }, { new: true });
    if (!business) throw new ApiError(404, 'Business was not found');
    await PlatformAuditModel.create({ adminId: request.platformAuth.adminId, action: 'business.subscription.updated', targetType: 'business', targetId: business.id, metadata: parsed.data });
    response.json({ business: { id: business.id, subscription: business.subscription } });
  } catch (error: unknown) { next(error); }
};

export const listPlatformPayments: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20));
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
    let businessFilter: Record<string, unknown> = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = await BusinessModel.find({ $or: [{ name: { $regex: escaped, $options: 'i' } }, { slug: { $regex: escaped, $options: 'i' } }] }).select('_id').lean();
      businessFilter = { businessId: { $in: matches.map((item) => item._id) } };
    }
    const [records, total] = await Promise.all([
      PlatformPaymentModel.find(businessFilter).sort({ paidAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('businessId', 'name slug').populate('recordedBy', 'name').lean(),
      PlatformPaymentModel.countDocuments(businessFilter),
    ]);
    response.json({ items: records.map((payment) => {
      const business = payment.businessId as unknown as { _id: unknown; name: string; slug: string };
      const admin = payment.recordedBy as unknown as { name: string };
      return { id: String(payment._id), businessId: String(business._id), businessName: business.name, businessSlug: business.slug, amount: payment.amount, currency: payment.currency, method: payment.method, reference: payment.reference, paidAt: payment.paidAt, plan: payment.plan, periodEnd: payment.periodEnd, recordedByName: admin.name };
    }), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: unknown) { next(error); }
};

export const recordPlatformPayment: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.platformAuth) throw new ApiError(401, 'Platform authentication is required');
    const parsed = paymentSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Payment details are invalid', parsed.error.flatten().fieldErrors);
    const existing = await BusinessModel.findById(request.params.businessId).select('name createdAt subscription');
    if (!existing) throw new ApiError(404, 'Business was not found');
    const payment = await PlatformPaymentModel.create({ businessId: existing._id, ...parsed.data, currency: 'RWF', recordedBy: request.platformAuth.adminId });
    try {
      const business = await BusinessModel.findByIdAndUpdate(existing._id, { $set: { 'subscription.plan': parsed.data.plan, 'subscription.status': 'active', 'subscription.startedAt': existing.subscription?.startedAt ?? parsed.data.paidAt, 'subscription.currentPeriodEnd': parsed.data.periodEnd } }, { new: true });
      if (!business) throw new ApiError(404, 'Business was not found');
      await PlatformAuditModel.create({ adminId: request.platformAuth.adminId, action: 'payment.recorded', targetType: 'business', targetId: existing.id, metadata: { paymentId: payment.id, amount: payment.amount, currency: payment.currency, method: payment.method, reference: payment.reference, plan: payment.plan, periodEnd: payment.periodEnd } });
    } catch (error: unknown) {
      await PlatformPaymentModel.deleteOne({ _id: payment._id });
      if (existing.subscription) await BusinessModel.findByIdAndUpdate(existing._id, { $set: { subscription: existing.subscription } });
      else await BusinessModel.findByIdAndUpdate(existing._id, { $unset: { subscription: 1 } });
      throw error;
    }
    response.status(201).json({ payment: { id: payment.id, businessId: existing.id, businessName: existing.name, amount: payment.amount, currency: payment.currency, method: payment.method, reference: payment.reference, paidAt: payment.paidAt, plan: payment.plan, periodEnd: payment.periodEnd } });
  } catch (error: unknown) { next(error); }
};

export const listPlatformUsers: RequestHandler = async (_request, response, next): Promise<void> => {
  try {
    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    const businessIds = [...new Set(users.map((user) => user.businessId.toString()))];
    const businesses = await BusinessModel.find({ _id: { $in: businessIds } }).select('name').lean();
    const businessNames = new Map(businesses.map((business) => [business._id.toString(), business.name]));
    response.json({
      items: users.map((user) => ({
        id: user._id.toString(), firstName: user.firstName, lastName: user.lastName,
        email: user.email, role: user.role, isActive: user.isActive,
        businessId: user.businessId.toString(), businessName: businessNames.get(user.businessId.toString()) ?? 'Unknown business',
      })),
    });
  } catch (error: unknown) { next(error); }
};

export const resetPlatformUserPassword: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.platformAuth) throw new ApiError(401, 'Platform authentication is required');
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Password must be 8-72 characters and include uppercase, lowercase, and a number');
    const user = await UserModel.findOne({ _id: request.params.userId, businessId: request.params.businessId });
    if (!user) throw new ApiError(404, 'User was not found');
    user.passwordHash = await hash(parsed.data.password, 12);
    await user.save();
    await PlatformAuditModel.create({ adminId: request.platformAuth.adminId, action: 'user.password.reset', targetType: 'user', targetId: user.id, metadata: { businessId: user.businessId.toString() } });
    response.json({ message: 'User password reset successfully' });
  } catch (error: unknown) { next(error); }
};

export const platformSummary: RequestHandler = async (_request, response, next): Promise<void> => {
  try {
    const [businesses, activeBusinesses, users, branches, sectors, plans, attentionBusinesses, trialBusinesses, paymentTotals] = await Promise.all([
      BusinessModel.countDocuments(), BusinessModel.countDocuments({ status: 'active' }), UserModel.countDocuments(), BranchModel.countDocuments(),
      BusinessModel.aggregate<{ _id: string; count: number }>([{ $group: { _id: { $cond: [{ $eq: ['$industry', 'clinic'] }, 'building_materials', { $ifNull: ['$industry', 'retail'] }] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      BusinessModel.aggregate<{ _id: string; count: number }>([{ $group: { _id: { $ifNull: ['$subscription.plan', 'trial'] }, count: { $sum: 1 } } }]),
      BusinessModel.countDocuments({ $or: [{ status: 'suspended' }, { 'subscription.status': { $in: ['past_due', 'cancelled'] } }] }),
      BusinessModel.countDocuments({ $or: [{ 'subscription.status': 'trialing' }, { subscription: { $exists: false } }] }),
      PlatformPaymentModel.aggregate<{ total: number; count: number }>([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    ]);
    response.json({ businesses, activeBusinesses, suspendedBusinesses: businesses - activeBusinesses, users, branches, sectors: sectors.map((item) => ({ industry: item._id, count: item.count })), plans: plans.map((item) => ({ plan: item._id, count: item.count })), attentionBusinesses, trialBusinesses, paymentCount: paymentTotals[0]?.count ?? 0, paymentVolume: paymentTotals[0]?.total ?? 0 });
  } catch (error: unknown) { next(error); }
};

