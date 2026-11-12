import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createMenu, createOrder, createTable, listMenu, listOrders, listTables, overview, updateOrderStatus } from './restaurant.controller.js';
export const restaurantRouter=Router();restaurantRouter.use(authenticate);restaurantRouter.use(authorizeRoles('owner','admin','manager','cashier'));restaurantRouter.get('/overview',overview);restaurantRouter.get('/menu',listMenu);restaurantRouter.post('/menu',createMenu);restaurantRouter.get('/tables',listTables);restaurantRouter.post('/tables',createTable);restaurantRouter.get('/orders',listOrders);restaurantRouter.post('/orders',createOrder);restaurantRouter.patch('/orders/:orderId/status',updateOrderStatus);
