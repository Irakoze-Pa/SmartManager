import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { platformRouter } from '../modules/platform/platform.routes.js';
import { tenantAdminRouter } from '../modules/tenant-admin/tenant-admin.routes.js';
import { catalogRouter } from '../modules/catalog/catalog.routes.js';
import { inventoryRouter } from '../modules/inventory/inventory.routes.js';
import { salesRouter } from '../modules/sales/sales.routes.js';
import { purchasingRouter } from '../modules/purchasing/purchasing.routes.js';
import { customersRouter } from '../modules/customers/customers.routes.js';
import { financeRouter } from '../modules/finance/finance.routes.js';
import { reportsRouter } from '../modules/reports/reports.routes.js';
import { subscriptionRouter } from '../modules/subscription/subscription.routes.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { restaurantRouter } from '../modules/restaurant/restaurant.routes.js';
import { rentalRouter } from '../modules/rentals/rental.routes.js';
import { accountingRouter } from '../modules/accounting/accounting.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use(requireDatabase);
apiRouter.use('/auth', authRouter);
apiRouter.use('/platform', platformRouter);
apiRouter.use('/tenant-admin', tenantAdminRouter);
apiRouter.use('/catalog', catalogRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/purchasing', purchasingRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/finance', financeRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/subscription', subscriptionRouter);
apiRouter.use('/restaurant', restaurantRouter);
apiRouter.use('/rentals', rentalRouter);
apiRouter.use('/accounting', accountingRouter);

