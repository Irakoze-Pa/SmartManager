import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createExpense, financeSummary, listExpenses } from './finance.controller.js';
export const financeRouter = Router();
financeRouter.use(authenticate, authorizeRoles('owner', 'admin', 'manager'));
financeRouter.get('/summary', financeSummary);
financeRouter.get('/expenses', listExpenses);
financeRouter.post('/expenses', createExpense);
