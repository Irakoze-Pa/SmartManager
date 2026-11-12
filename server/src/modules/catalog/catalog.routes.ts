import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { catalogSummary, createCategory, createProduct, listCategories, listProducts, setProductImage, setProductPackage, setProductStatus, updateProduct } from './catalog.controller.js';
export const catalogRouter = Router();
catalogRouter.use(authenticate);
catalogRouter.get('/categories', listCategories); catalogRouter.get('/products', listProducts); catalogRouter.get('/summary', catalogSummary);
catalogRouter.post('/categories', authorizeRoles('owner', 'admin', 'manager', 'inventory'), createCategory);
catalogRouter.post('/products', authorizeRoles('owner', 'admin', 'manager', 'inventory'), createProduct);
catalogRouter.patch('/products/:productId', authorizeRoles('owner', 'admin', 'manager', 'inventory'), updateProduct);
catalogRouter.patch('/products/:productId/status', authorizeRoles('owner', 'admin', 'manager', 'inventory'), setProductStatus);
catalogRouter.patch('/products/:productId/package', authorizeRoles('owner', 'admin', 'manager', 'inventory'), setProductPackage);
catalogRouter.patch('/products/:productId/image', authorizeRoles('owner', 'admin', 'manager', 'inventory'), setProductImage);

