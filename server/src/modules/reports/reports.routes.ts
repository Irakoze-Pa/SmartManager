import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { businessReport } from './reports.controller.js';
export const reportsRouter = Router();
reportsRouter.use(authenticate, authorizeRoles('owner', 'admin', 'manager'));
reportsRouter.get('/', businessReport);
