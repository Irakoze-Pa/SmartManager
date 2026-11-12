import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { adjustInventory, listInventory, listInventoryBranches } from './inventory.controller.js';
import { createTransfer, listTransfers } from './inventory-transfer.controller.js';
export const inventoryRouter = Router();
inventoryRouter.use(authenticate); inventoryRouter.get('/branches', listInventoryBranches); inventoryRouter.get('/', listInventory); inventoryRouter.post('/adjustments', authorizeRoles('owner', 'admin', 'manager', 'inventory'), adjustInventory);
inventoryRouter.get('/transfers', authorizeRoles('owner', 'admin', 'manager', 'inventory'), listTransfers);
inventoryRouter.post('/transfers', authorizeRoles('owner', 'admin', 'manager', 'inventory'), createTransfer);

