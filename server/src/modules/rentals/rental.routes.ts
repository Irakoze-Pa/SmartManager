import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createEquipment, createHFrameCatalog, createRental, listEquipment, listRentals, overview, updateEquipment, updateRental } from './rental.controller.js';

export const rentalRouter = Router();
rentalRouter.use(authenticate);
rentalRouter.use(authorizeRoles('owner', 'admin', 'manager', 'cashier'));
rentalRouter.get('/overview', overview);
rentalRouter.get('/equipment', listEquipment);
rentalRouter.post('/equipment', createEquipment);
rentalRouter.post('/equipment/h-frame-catalog', createHFrameCatalog);
rentalRouter.patch('/equipment/:equipmentId', updateEquipment);
rentalRouter.get('/', listRentals);
rentalRouter.post('/', createRental);
rentalRouter.patch('/:rentalId', updateRental);
