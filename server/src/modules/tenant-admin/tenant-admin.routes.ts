import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createTenantBranch, createTenantStaff, listTenantBranches, listTenantStaff, updateTenantBranchStatus, updateTenantStaffStatus } from './tenant-admin.controller.js';

export const tenantAdminRouter = Router();
tenantAdminRouter.use(authenticate, authorizeRoles('owner', 'admin'));
tenantAdminRouter.get('/branches', listTenantBranches);
tenantAdminRouter.post('/branches', createTenantBranch);
tenantAdminRouter.patch('/branches/:branchId/status', updateTenantBranchStatus);
tenantAdminRouter.get('/staff', listTenantStaff);
tenantAdminRouter.post('/staff', createTenantStaff);
tenantAdminRouter.patch('/staff/:userId/status', updateTenantStaffStatus);

