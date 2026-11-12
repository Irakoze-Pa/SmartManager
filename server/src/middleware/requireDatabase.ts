import type { RequestHandler } from 'express';
import { isDatabaseConnected } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

export const requireDatabase: RequestHandler = (_request, _response, next): void => {
  if (!isDatabaseConnected()) {
    next(new ApiError(503, 'Database connection is unavailable. Check MongoDB Atlas Network Access and try again shortly.'));
    return;
  }
  next();
};
