import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';

interface AttemptBucket { count: number; resetAt: number }

export const rateLimit = (limit: number, windowMs: number): RequestHandler => {
  const attempts = new Map<string, AttemptBucket>();
  return (request, response, next): void => {
    const now = Date.now();
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const current = attempts.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    attempts.set(key, bucket);
    response.setHeader('RateLimit-Limit', limit);
    response.setHeader('RateLimit-Remaining', Math.max(0, limit - bucket.count));
    response.setHeader('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));
    if (attempts.size > 5_000) {
      for (const [attemptKey, value] of attempts) if (value.resetAt <= now) attempts.delete(attemptKey);
    }
    if (bucket.count > limit) {
      response.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      next(new ApiError(429, 'Too many attempts. Please try again later.'));
      return;
    }
    next();
  };
};
