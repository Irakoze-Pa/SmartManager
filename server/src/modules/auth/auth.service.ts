import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { BranchModel } from '../branches/branch.model.js';
import { BusinessModel } from '../businesses/business.model.js';
import { UserModel, type UserRole } from '../users/user.model.js';
import type { LoginInput, RegisterInput } from './auth.validation.js';

const jwtKey = new TextEncoder().encode(env.JWT_SECRET);
const normalizeIndustry = (industry?: string): string => industry === 'clinic' ? 'building_materials' : industry ?? 'retail';

const createSlug = (name: string): string => {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'business';
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
};

const signToken = async (userId: string, businessId: string, role: UserRole): Promise<string> =>
  new SignJWT({ businessId, role, tokenType: 'tenant' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(jwtKey);

export interface AuthenticatedIdentity {
  token: string;
  user: { id: string; firstName: string; lastName: string; email: string; role: UserRole };
  business: { id: string; name: string; slug: string; logoUrl: string; phone: string; email: string; address: string; tin: string; registrationNumber: string; businessType: string; industry: string };
  branch: { id: string; name: string; code: string };
}

export const registerBusiness = async (input: RegisterInput): Promise<AuthenticatedIdentity> => {
  const existingUser = await UserModel.exists({ email: input.email });
  if (existingUser) throw new ApiError(409, 'An account with this email already exists');

  const businessId = new Types.ObjectId();
  const branchId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const passwordHash = await hash(input.password, 12);
  const slug = createSlug(input.businessName);

  try {
    const [business, branch, user] = await Promise.all([
      BusinessModel.create({ _id: businessId, name: input.businessName, slug, logoUrl: input.logoUrl, phone: input.businessPhone, email: input.businessEmail, address: input.businessAddress, tin: input.tin, registrationNumber: input.registrationNumber, businessType: input.businessType, industry: input.industry, subscription: { plan: 'trial', status: 'trialing', startedAt: new Date(), currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } }),
      BranchModel.create({ _id: branchId, businessId, name: input.branchName ?? input.businessName, code: 'MAIN', isPrimary: true }),
      UserModel.create({ _id: userId, businessId, defaultBranchId: branchId, branchIds: [branchId], firstName: input.firstName, lastName: input.lastName, email: input.email, passwordHash, role: 'owner' }),
    ]);

    return {
      token: await signToken(user.id, business.id, user.role),
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
      business: { id: business.id, name: business.name, slug: business.slug, logoUrl: business.logoUrl ?? '', phone: business.phone ?? '', email: business.email ?? '', address: business.address ?? '', tin: business.tin ?? '', registrationNumber: business.registrationNumber ?? '', businessType: business.businessType ?? 'sole_trader', industry: normalizeIndustry(business.industry) },
      branch: { id: branch.id, name: branch.name, code: branch.code },
    };
  } catch (error: unknown) {
    await Promise.allSettled([
      UserModel.deleteOne({ _id: userId }),
      BranchModel.deleteOne({ _id: branchId }),
      BusinessModel.deleteOne({ _id: businessId }),
    ]);
    throw error;
  }
};

export const login = async (input: LoginInput): Promise<AuthenticatedIdentity> => {
  const user = await UserModel.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !user.isActive || !(await compare(input.password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const [business, branch] = await Promise.all([
    BusinessModel.findOne({ _id: user.businessId, status: 'active' }),
    BranchModel.findOne({ _id: user.defaultBranchId, businessId: user.businessId, isActive: true }),
  ]);
  if (!business || !branch) throw new ApiError(403, 'This workspace is unavailable');

  return {
    token: await signToken(user.id, business.id, user.role),
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
    business: { id: business.id, name: business.name, slug: business.slug, logoUrl: business.logoUrl ?? '', phone: business.phone ?? '', email: business.email ?? '', address: business.address ?? '', tin: business.tin ?? '', registrationNumber: business.registrationNumber ?? '', businessType: business.businessType ?? 'sole_trader', industry: normalizeIndustry(business.industry) },
    branch: { id: branch.id, name: branch.name, code: branch.code },
  };
};

export const verifyToken = async (token: string): Promise<{ userId: string; businessId: string; role: UserRole }> => {
  try {
    const { payload } = await jwtVerify(token, jwtKey, { algorithms: ['HS256'] });
    if (!payload.sub || payload.tokenType !== 'tenant' || typeof payload.businessId !== 'string' || typeof payload.role !== 'string') throw new Error('Malformed token');
    return { userId: payload.sub, businessId: payload.businessId, role: payload.role as UserRole };
  } catch {
    throw new ApiError(401, 'Authentication token is invalid or expired');
  }
};

export const getIdentity = async (userId: string, businessId: string): Promise<Omit<AuthenticatedIdentity, 'token'>> => {
  const user = await UserModel.findOne({ _id: userId, businessId, isActive: true });
  if (!user) throw new ApiError(401, 'User account is unavailable');
  const [business, branch] = await Promise.all([
    BusinessModel.findOne({ _id: businessId, status: 'active' }),
    BranchModel.findOne({ _id: user.defaultBranchId, businessId, isActive: true }),
  ]);
  if (!business || !branch) throw new ApiError(403, 'This workspace is unavailable');
  return {
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
    business: { id: business.id, name: business.name, slug: business.slug, logoUrl: business.logoUrl ?? '', phone: business.phone ?? '', email: business.email ?? '', address: business.address ?? '', tin: business.tin ?? '', registrationNumber: business.registrationNumber ?? '', businessType: business.businessType ?? 'sole_trader', industry: normalizeIndustry(business.industry) },
    branch: { id: branch.id, name: branch.name, code: branch.code },
  };
};

