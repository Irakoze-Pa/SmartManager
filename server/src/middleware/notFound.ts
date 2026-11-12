import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (request: Request, _response: Response, next: NextFunction): void => {
  next(new ApiError(404, `Route ${request.method} ${request.originalUrl} was not found`));
};

