import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { getSubscription } from './subscription.controller.js';
export const subscriptionRouter = Router();
subscriptionRouter.get('/', authenticate, authorizeRoles('owner', 'admin'), getSubscription);
