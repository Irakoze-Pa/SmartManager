import { compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { PlatformAdminModel } from './platform-admin.model.js';

const platformKey = new TextEncoder().encode(env.PLATFORM_JWT_SECRET);

const signPlatformToken = async (adminId: string, email: string): Promise<string> =>
  new SignJWT({ email, tokenType: 'platform' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(env.PLATFORM_JWT_EXPIRES_IN)
    .sign(platformKey);

export const loginPlatformAdmin = async (email: string, password: string) => {
  const admin = await PlatformAdminModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!admin || !admin.isActive || !(await compare(password, admin.passwordHash))) {
    throw new ApiError(401, 'Invalid platform administrator credentials');
  }
  admin.lastLoginAt = new Date();
  await admin.save();
  return { token: await signPlatformToken(admin.id, admin.email), admin: { id: admin.id, name: admin.name, email: admin.email } };
};

export const verifyPlatformToken = async (token: string): Promise<{ adminId: string; email: string }> => {
  try {
    const { payload } = await jwtVerify(token, platformKey, { algorithms: ['HS256'] });
    if (!payload.sub || payload.tokenType !== 'platform' || typeof payload.email !== 'string') throw new Error('Malformed token');
    return { adminId: payload.sub, email: payload.email };
  } catch {
    throw new ApiError(401, 'Platform session is invalid or expired');
  }
};

export const getPlatformAdmin = async (adminId: string) => {
  const admin = await PlatformAdminModel.findOne({ _id: adminId, isActive: true });
  if (!admin) throw new ApiError(401, 'Platform administrator is unavailable');
  return { id: admin.id, name: admin.name, email: admin.email };
};

