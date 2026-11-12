import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createSale, getSale, listSales } from './sales.controller.js';

export const salesRouter = Router();
salesRouter.use(authenticate);
salesRouter.use(authorizeRoles('owner', 'admin', 'manager', 'cashier'));
salesRouter.get('/', listSales);
salesRouter.get('/:saleId', getSale);
salesRouter.post('/', createSale);
