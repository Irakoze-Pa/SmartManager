import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import type { ApiErrorResponse } from '../types/http.js';
import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next): void => {
  const isApiError = error instanceof ApiError;
  const isZodError = error instanceof ZodError;
  const mongoError = error as { name?: string; code?: number };
  const isInvalidId = mongoError.name === 'CastError';
  const isDuplicate = mongoError.code === 11_000;
  const isValidation = mongoError.name === 'ValidationError';
  const statusCode = isApiError ? error.statusCode : isZodError ? 422 : isInvalidId ? 400 : isDuplicate ? 409 : isValidation ? 422 : 500;
  const firstZodIssue = isZodError ? error.issues[0] : undefined;
  const zodField = firstZodIssue?.path.join(' ');
  const message = isApiError ? error.message : isZodError ? `${zodField ? `${zodField}: ` : ''}${firstZodIssue?.message ?? 'The supplied data is invalid'}` : isInvalidId ? 'The supplied identifier is invalid' : isDuplicate ? 'A record with these details already exists' : isValidation ? 'The supplied data is invalid' : 'An unexpected server error occurred';

  if (!isApiError && !isZodError && !isInvalidId && !isDuplicate && !isValidation) {
    console.error(error);
  }

  const payload: ApiErrorResponse = {
    success: false,
    error: {
      message,
      ...(isApiError && error.details !== undefined ? { details: error.details } : {}),
      ...(env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {}),
    },
  };

  response.status(statusCode).json(payload);
};

