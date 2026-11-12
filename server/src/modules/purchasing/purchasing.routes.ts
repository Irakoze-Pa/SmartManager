import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { cancelPurchaseOrder, createPurchaseOrder, createSupplier, listPurchaseOrders, listSuppliers, receivePurchaseOrder, setSupplierStatus } from './purchasing.controller.js';

export const purchasingRouter = Router();
purchasingRouter.use(authenticate, authorizeRoles('owner', 'admin', 'manager', 'inventory'));
purchasingRouter.get('/suppliers', listSuppliers);
purchasingRouter.post('/suppliers', createSupplier);
purchasingRouter.patch('/suppliers/:supplierId/status', setSupplierStatus);
purchasingRouter.get('/orders', listPurchaseOrders);
purchasingRouter.post('/orders', createPurchaseOrder);
purchasingRouter.post('/orders/:purchaseOrderId/receive', receivePurchaseOrder);
purchasingRouter.post('/orders/:purchaseOrderId/cancel', cancelPurchaseOrder);
