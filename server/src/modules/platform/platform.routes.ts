import { Router } from 'express';
import { authenticatePlatform } from '../../middleware/authenticatePlatform.js';
import { createPlatformBusiness, listBusinesses, listPlatformUsers, platformLogin, platformMe, platformSummary, resetPlatformUserPassword, setBusinessStatus, setBusinessSubscription } from './platform.controller.js';
import { rateLimit } from '../../middleware/rateLimit.js';

export const platformRouter = Router();
platformRouter.post('/auth/login', rateLimit(10, 15 * 60 * 1000), platformLogin);
platformRouter.get('/auth/me', authenticatePlatform, platformMe);
platformRouter.get('/summary', authenticatePlatform, platformSummary);
platformRouter.get('/businesses', authenticatePlatform, listBusinesses);
platformRouter.post('/businesses', authenticatePlatform, createPlatformBusiness);
platformRouter.get('/users', authenticatePlatform, listPlatformUsers);
platformRouter.patch('/businesses/:businessId/status', authenticatePlatform, setBusinessStatus);
platformRouter.patch('/businesses/:businessId/subscription', authenticatePlatform, setBusinessSubscription);
platformRouter.patch('/businesses/:businessId/users/:userId/password', authenticatePlatform, resetPlatformUserPassword);

