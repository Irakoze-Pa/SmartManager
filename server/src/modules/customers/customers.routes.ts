import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createCustomer, deleteCustomer, getCustomerStatement, listCustomers, recordCreditPayment, setCustomerStatus, updateCustomer } from './customers.controller.js';

export const customersRouter = Router();
customersRouter.use(authenticate);
customersRouter.get('/', listCustomers);
customersRouter.post('/', authorizeRoles('owner', 'admin', 'manager', 'cashier'), createCustomer);
customersRouter.patch('/:customerId', authorizeRoles('owner', 'admin', 'manager', 'cashier'), updateCustomer);
customersRouter.delete('/:customerId', authorizeRoles('owner', 'admin', 'manager'), deleteCustomer);
customersRouter.patch('/:customerId/status', authorizeRoles('owner', 'admin', 'manager'), setCustomerStatus);
customersRouter.get('/:customerId/statement', getCustomerStatement);
customersRouter.post('/:customerId/payments', authorizeRoles('owner', 'admin', 'manager', 'cashier'), recordCreditPayment);
