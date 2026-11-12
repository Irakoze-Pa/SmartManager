import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../modules/auth/auth.service.js';
import { UserModel } from '../modules/users/user.model.js';

export const authenticate: RequestHandler = async (request, _response, next): Promise<void> => {
  try {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new ApiError(401, 'Authentication is required');
    const auth = await verifyToken(authorization.slice(7));
    const user = await UserModel.findOne({ _id: auth.userId, businessId: auth.businessId, isActive: true }).select('role').lean();
    if (!user) throw new ApiError(401, 'User account is unavailable');
    request.auth = { ...auth, role: user.role };
    next();
  } catch (error: unknown) {
    next(error);
  }
};

