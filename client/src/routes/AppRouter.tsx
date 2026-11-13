import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AuthProvider } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { PlatformAuthProvider } from '../features/platform/PlatformAuthContext';
import { PlatformProtectedRoute } from '../features/platform/PlatformProtectedRoute';
import { PlatformLoginPage } from '../pages/PlatformLoginPage';
import { PlatformDashboardPage } from '../pages/PlatformDashboardPage';
import { BranchesPage } from '../pages/BranchesPage';
import { TeamPage } from '../pages/TeamPage';
import { TenantAdminRoute } from '../features/auth/TenantAdminRoute';
import { ProductsPage } from '../pages/ProductsPage';
import { InventoryPage } from '../pages/InventoryPage';
import { PointOfSalePage } from '../pages/PointOfSalePage';
import { PurchasingPage } from '../pages/PurchasingPage';
import { CustomersPage } from '../pages/CustomersPage';
import { FinancePage } from '../pages/FinancePage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';
import { RestaurantPage } from '../pages/RestaurantPage';
import { RentalsPage } from '../pages/RentalsPage';
import { AccountingPage } from '../pages/AccountingPage';
import { StatementsPage } from '../pages/StatementsPage';

export function AppRouter() {
  return (
    <BrowserRouter><AuthProvider><PlatformAuthProvider><Routes>
      <Route element={<AuthLayout />}><Route path="login" element={<LoginPage />} /></Route>
      <Route element={<ProtectedRoute />}><Route element={<DashboardLayout />}><Route index element={<DashboardPage />} /><Route path="restaurant" element={<RestaurantPage />} /><Route path="rentals" element={<RentalsPage />} /><Route path="pos" element={<PointOfSalePage />} /><Route path="products" element={<ProductsPage />} /><Route path="inventory" element={<InventoryPage />} /><Route path="purchasing" element={<PurchasingPage />} /><Route path="customers" element={<CustomersPage />} /><Route path="statements" element={<StatementsPage />} /><Route path="finance" element={<FinancePage />} /><Route path="accounting" element={<AccountingPage />} /><Route path="reports" element={<ReportsPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="help" element={<HelpCenterPage />} /><Route element={<TenantAdminRoute />}><Route path="branches" element={<BranchesPage />} /><Route path="team" element={<TeamPage />} /><Route path="subscription" element={<Navigate to="/settings" replace />} /></Route></Route></Route>
      <Route path="platform/login" element={<PlatformLoginPage />} />
      <Route element={<PlatformProtectedRoute />}><Route path="platform" element={<PlatformDashboardPage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></PlatformAuthProvider></AuthProvider></BrowserRouter>
  );
}

