import type { RequestHandler } from 'express';
import { BusinessModel } from '../businesses/business.model.js';
import { ApiError } from '../../utils/ApiError.js';

export const getSubscription: RequestHandler = async (request, response, next) => { try {
  if (!request.auth) throw new ApiError(401, 'Authentication is required');
  const business = await BusinessModel.findOne({ _id: request.auth.businessId, status: 'active' }).select('name subscription').lean();
  if (!business) throw new ApiError(404, 'Business was not found');
  response.json({ businessName: business.name, subscription: business.subscription });
} catch (error) { next(error); } };
