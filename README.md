# SmartShop Pro

SmartShop Pro is a multi-tenant SaaS foundation for retail and trade businesses. Phase 1 established the platform; Phase 2 added tenant identity and administration; later phases added catalog, inventory, transactional point-of-sale checkout, purchasing, finance summaries, reporting, and subscription visibility. Full double-entry accounting, automated billing, and offline synchronization are intentionally not implemented yet.

## Project structure

```text
smartshop-pro/
├── client/                  React + Vite application
│   └── src/
│       ├── assets/          Static assets
│       ├── components/      Reusable UI components
│       ├── features/        Future feature modules
│       ├── hooks/           Reusable React hooks
│       ├── layouts/         Application layouts
│       ├── pages/           Route-level pages
│       ├── routes/          Router configuration
│       ├── services/        HTTP and API services
│       └── types/           Shared client types
└── server/                  Express + MongoDB API
    └── src/
        ├── config/          Environment and database configuration
        ├── middleware/      Express middleware
        ├── modules/         Domain modules (added by feature)
        ├── routes/          API route composition
        ├── types/           Server type declarations
        └── utils/           Shared server utilities
```

## Prerequisites

- Node.js 20.19 through 24 (Node 22 LTS recommended; run `nvm use`)
- npm 10 or newer
- A local or hosted MongoDB instance

## Setup

1. Install all dependencies:

   ```bash
   npm run install:all
   ```

2. Create local environment files:

   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

3. The app uses MongoDB Atlas. Set `MONGODB_URI`, add your current IP in Atlas
   Network Access, and never commit `server/.env`. The API fails closed when
   Atlas is unavailable, preventing accidental data splits. Check
   `databaseTarget` in `GET /api/health` to confirm the active connection.

   Also replace `JWT_SECRET` with a cryptographically random value containing at least 32 characters, for example:

   ```bash
   openssl rand -base64 48
   ```

4. Run both applications:

   ```bash
   npm run dev
   ```

   Keep this terminal open while using the application. The combined command manages both processes and now stops the companion service if either one fails, preventing a misleading frontend-only state. Use `npm run dev:client` only when you intentionally do not need API features.

   If Atlas reports an IP allowlist or `ReplicaSetNoPrimary` error, open MongoDB Atlas → Network Access → Add IP Address, add your current IP, wait for the rule to become active, and run `npm run dev` again.

The client runs at `http://localhost:5173`, the API at `http://localhost:7310`, and the health endpoint is `GET http://localhost:7310/api/health`. The high API port avoids common macOS and development-service conflicts.

Vite may select another port when 5173 is occupied. During development the API accepts localhost and 127.0.0.1 browser origins on any port. Production remains restricted to the comma-separated URLs configured in `CLIENT_ORIGIN`.

Each application can also run independently with `npm run dev:client` or `npm run dev:server`.

## Verification

```bash
npm run typecheck
npm run build
```

## Architecture notes

- The server is a modular monolith. Each future business domain belongs in `server/src/modules/<domain>` with its own model, service, controller, validator, and routes.
- Tenant-owned records must carry a business identifier, and every query must be scoped by the authenticated business. The Phase 2 identity layer supplies this context before business data modules are introduced.
- Phase 2 authentication verifies a signed bearer token and attaches `userId`, `businessId`, and `role` to protected requests. Future modules must still scope every query explicitly with `businessId`.
- Owner registration creates the business, primary branch, and first owner account. Team invitations and permission enforcement are not implemented yet.
- The client uses a centralized Axios instance and Orange · Charcoal · Soft White design tokens. The API URL and visual palette are not scattered through feature code.
- The future offline POS should be implemented behind a synchronization boundary rather than coupling local storage directly to API components.

## API endpoints

- `GET /api/health` — public service health
- `POST /api/auth/login` — authenticate an existing user
- `GET /api/auth/me` — return the verified current identity
- `POST /api/platform/auth/login` — platform administrator authentication
- `GET /api/platform/auth/me` — current platform administrator
- `GET /api/platform/summary` — platform totals
- `GET /api/platform/businesses` — paginated tenant oversight
- `POST /api/platform/businesses` — superadmin-only company and owner onboarding
- `GET /api/platform/users` — platform user oversight
- `PATCH /api/platform/businesses/:businessId/status` — suspend or reactivate a tenant
- `PATCH /api/platform/businesses/:businessId/users/:userId/password` — audited user password reset
- `GET/POST /api/tenant-admin/branches` — list or create tenant branches (owner/admin)
- `PATCH /api/tenant-admin/branches/:branchId/status` — activate or deactivate a branch
- `GET/POST /api/tenant-admin/staff` — list or create tenant staff (owner/admin)
- `PATCH /api/tenant-admin/staff/:userId/status` — activate or deactivate staff access
- `GET/POST /api/catalog/categories` — tenant categories
- `GET/POST /api/catalog/products` — tenant product catalog
- `PATCH /api/catalog/products/:productId/status` — product availability
- `PATCH /api/catalog/products/:productId/package` — configure an optional selling package and base-unit conversion
- `PATCH /api/catalog/products/:productId/image` — add, replace, or remove a compressed product image
- `GET /api/inventory/branches` — active branches available to inventory users
- `GET /api/inventory?branchId=...` — branch stock balances
- `POST /api/inventory/adjustments` — audited stock quantity adjustment
- `GET/POST /api/inventory/transfers` — list or complete atomic branch stock transfers
- `GET/POST /api/purchasing/suppliers` — list or create tenant suppliers
- `PATCH /api/purchasing/suppliers/:supplierId/status` — activate or deactivate a supplier
- `GET/POST /api/purchasing/orders` — list or create purchase orders
- `POST /api/purchasing/orders/:purchaseOrderId/receive` — receive an order into branch inventory
- `POST /api/purchasing/orders/:purchaseOrderId/cancel` — cancel a draft purchase order
- `GET/POST /api/customers` — list customers with sales activity or create a customer
- `PATCH /api/customers/:customerId/status` — activate or deactivate a customer
- `GET /api/finance/summary` — revenue, cost of goods, expenses, and profit by period
- `GET/POST /api/finance/expenses` — list or record operating expenses
- `GET /api/reports` — sales trends, top products, payment mix, and low-stock reporting
- `GET /api/subscription` — tenant subscription visibility
- `PATCH /api/platform/businesses/:businessId/subscription` — platform-managed plan and billing status
- `GET/POST /api/rentals/equipment` — list or register tenant rental equipment
- `PATCH /api/rentals/equipment/:equipmentId` — update rates, quantities, deposits, or maintenance state
- `GET/POST /api/rentals` — list or dispatch multi-item equipment rentals
- `PATCH /api/rentals/:rentalId` — record payments, extensions, charges, billable days, returns, or cancellations

## Create the first superadmin

Superadmins cannot register publicly. Create or rotate the account from the server environment using a one-time command. The password must contain at least 12 characters, uppercase, lowercase, and a number.

```bash
SUPERADMIN_NAME="Platform Administrator" \
SUPERADMIN_EMAIL="admin@example.com" \
SUPERADMIN_PASSWORD="replace-with-a-strong-password" \
npm run seed:superadmin --prefix server
```

Then visit `http://localhost:5173/platform/login`. Do not add these credentials to `.env`, source control, or shell scripts.

## Current status

Implemented: platform and tenant identity, platform oversight, tenant branches and staff, role-gated administration, tenant-scoped categories and products with base/package unit conversion, customers and linked purchase history, suppliers, purchase orders, per-branch stock balances and transfers, non-negative inventory enforcement, transactionally recorded stock receipts and adjustments, Atlas-transactional point-of-sale checkout, expense tracking, period-based profit summaries, business reporting, and platform-managed subscription state.

Not implemented by design: MFA, email delivery/invitations, self-service password recovery, forced temporary-password changes, refresh-token rotation, custom permission policies, partial purchase-order receipts, automated payment-gateway billing, full double-entry accounting, and offline POS.

# SmartManager
