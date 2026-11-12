import type { RequestHandler } from 'express';
import type { UserRole } from '../modules/users/user.model.js';
import { ApiError } from '../utils/ApiError.js';

export const authorizeRoles = (...roles: UserRole[]): RequestHandler => (request, _response, next): void => {
  if (!request.auth) { next(new ApiError(401, 'Authentication is required')); return; }
  if (!roles.includes(request.auth.role)) { next(new ApiError(403, 'You do not have permission to perform this action')); return; }
  next();
};

