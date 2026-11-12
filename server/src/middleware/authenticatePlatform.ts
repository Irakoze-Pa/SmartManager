import type { RequestHandler } from 'express';
import { getPlatformAdmin, verifyPlatformToken } from '../modules/platform/platform-auth.service.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticatePlatform: RequestHandler = async (request, _response, next): Promise<void> => {
  try {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new ApiError(401, 'Platform authentication is required');
    const platformAuth = await verifyPlatformToken(authorization.slice(7));
    await getPlatformAdmin(platformAuth.adminId);
    request.platformAuth = platformAuth;
    next();
  } catch (error: unknown) { next(error); }
};

