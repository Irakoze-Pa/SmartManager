import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { cancelPurchaseOrder, createPurchaseOrder, createSupplier, getSupplierStatement, listPurchaseOrders, listSuppliers, receivePurchaseOrder, recordSupplierPayment, setSupplierStatus } from './purchasing.controller.js';

export const purchasingRouter = Router();
purchasingRouter.use(authenticate, authorizeRoles('owner', 'admin', 'manager', 'inventory'));
purchasingRouter.get('/suppliers', listSuppliers);
purchasingRouter.get('/suppliers/:supplierId/statement', getSupplierStatement);
purchasingRouter.post('/suppliers', createSupplier);
purchasingRouter.patch('/suppliers/:supplierId/status', setSupplierStatus);
purchasingRouter.get('/orders', listPurchaseOrders);
purchasingRouter.post('/orders', createPurchaseOrder);
purchasingRouter.post('/orders/:purchaseOrderId/receive', receivePurchaseOrder);
purchasingRouter.post('/orders/:purchaseOrderId/payments', authorizeRoles('owner', 'admin', 'manager'), recordSupplierPayment);
purchasingRouter.post('/orders/:purchaseOrderId/cancel', cancelPurchaseOrder);
