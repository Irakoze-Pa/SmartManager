import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { completePlannedOrder, createPlannedOrder, createProductionOrder, createRecipe, listProductionOrders, listRecipes, productionReport, updateOrderStage } from './manufacturing.controller.js';

export const manufacturingRouter = Router();
manufacturingRouter.use(authenticate);
manufacturingRouter.get('/orders', listProductionOrders);
manufacturingRouter.get('/reports/production', productionReport);
manufacturingRouter.post('/orders', authorizeRoles('owner', 'admin', 'manager', 'inventory'), createPlannedOrder);
manufacturingRouter.post('/batches', authorizeRoles('owner', 'admin', 'manager', 'inventory'), createProductionOrder);
manufacturingRouter.post('/orders/:orderId/complete', authorizeRoles('owner', 'admin', 'manager', 'inventory'), completePlannedOrder);
manufacturingRouter.post('/orders/:orderId/stage', authorizeRoles('owner', 'admin', 'manager', 'inventory'), updateOrderStage);
manufacturingRouter.get('/recipes', listRecipes);
manufacturingRouter.post('/recipes', authorizeRoles('owner', 'admin', 'manager', 'inventory'), createRecipe);
