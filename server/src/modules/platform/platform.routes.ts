import { Router } from 'express';
import { authenticatePlatform } from '../../middleware/authenticatePlatform.js';
import { createPlatformBusiness, deletePlatformBusiness, listBusinesses, listPlatformPayments, listPlatformUsers, platformLogin, platformMe, platformSummary, recordPlatformPayment, resetPlatformUserPassword, setBusinessStatus, setBusinessSubscription, updatePlatformBusiness } from './platform.controller.js';
import { rateLimit } from '../../middleware/rateLimit.js';

export const platformRouter = Router();
platformRouter.post('/auth/login', rateLimit(10, 15 * 60 * 1000), platformLogin);
platformRouter.get('/auth/me', authenticatePlatform, platformMe);
platformRouter.get('/summary', authenticatePlatform, platformSummary);
platformRouter.get('/businesses', authenticatePlatform, listBusinesses);
platformRouter.get('/payments', authenticatePlatform, listPlatformPayments);
platformRouter.post('/businesses', authenticatePlatform, createPlatformBusiness);
platformRouter.patch('/businesses/:businessId', authenticatePlatform, updatePlatformBusiness);
platformRouter.delete('/businesses/:businessId', authenticatePlatform, deletePlatformBusiness);
platformRouter.post('/businesses/:businessId/payments', authenticatePlatform, recordPlatformPayment);
platformRouter.get('/users', authenticatePlatform, listPlatformUsers);
platformRouter.patch('/businesses/:businessId/status', authenticatePlatform, setBusinessStatus);
platformRouter.patch('/businesses/:businessId/subscription', authenticatePlatform, setBusinessSubscription);
platformRouter.patch('/businesses/:businessId/users/:userId/password', authenticatePlatform, resetPlatformUserPassword);

