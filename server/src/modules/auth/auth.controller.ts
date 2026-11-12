import type { RequestHandler } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { getIdentity, login, registerBusiness } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.validation.js';
import { businessProfileSchema } from './auth.validation.js';
import { BusinessModel } from '../businesses/business.model.js';

export const register: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Registration details are invalid', parsed.error.flatten().fieldErrors);
    response.status(201).json(await registerBusiness(parsed.data));
  } catch (error: unknown) { next(error); }
};

export const signIn: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Login details are invalid', parsed.error.flatten().fieldErrors);
    response.status(200).json(await login(parsed.data));
  } catch (error: unknown) { next(error); }
};

export const me: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.auth) throw new ApiError(401, 'Authentication is required');
    response.status(200).json(await getIdentity(request.auth.userId, request.auth.businessId));
  } catch (error: unknown) { next(error); }
};

export const updateBusinessProfile: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (!request.auth) throw new ApiError(401, 'Authentication is required');
    if (!['owner', 'admin'].includes(request.auth.role)) throw new ApiError(403, 'Owner or admin access is required');
    const parsed = businessProfileSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Business profile is invalid', parsed.error.flatten().fieldErrors);
    const business = await BusinessModel.findByIdAndUpdate(request.auth.businessId, parsed.data, { new: true });
    if (!business) throw new ApiError(404, 'Business was not found');
    response.json({ business: { id: business.id, name: business.name, slug: business.slug, logoUrl: business.logoUrl ?? '', phone: business.phone ?? '', email: business.email ?? '', address: business.address ?? '', tin: business.tin ?? '', registrationNumber: business.registrationNumber ?? '', businessType: business.businessType ?? 'sole_trader', industry: business.industry === 'clinic' ? 'building_materials' : business.industry ?? 'retail' } });
  } catch (error: unknown) { next(error); }
};

