import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLoader } from '../components/AppLoader';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AuthProvider } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { PlatformAuthProvider } from '../features/platform/PlatformAuthContext';
import { PlatformProtectedRoute } from '../features/platform/PlatformProtectedRoute';
import { TenantAdminRoute } from '../features/auth/TenantAdminRoute';
import { LanguageProvider } from '../features/language/LanguageContext';

const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const PlatformLoginPage = lazy(() => import('../pages/PlatformLoginPage').then((module) => ({ default: module.PlatformLoginPage })));
const PlatformDashboardPage = lazy(() => import('../pages/PlatformDashboardPage').then((module) => ({ default: module.PlatformDashboardPage })));
const BranchesPage = lazy(() => import('../pages/BranchesPage').then((module) => ({ default: module.BranchesPage })));
const TeamPage = lazy(() => import('../pages/TeamPage').then((module) => ({ default: module.TeamPage })));
const ProductsPage = lazy(() => import('../pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const InventoryPage = lazy(() => import('../pages/InventoryPage').then((module) => ({ default: module.InventoryPage })));
const PointOfSalePage = lazy(() => import('../pages/PointOfSalePage').then((module) => ({ default: module.PointOfSalePage })));
const PurchasingPage = lazy(() => import('../pages/PurchasingPage').then((module) => ({ default: module.PurchasingPage })));
const CustomersPage = lazy(() => import('../pages/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const FinancePage = lazy(() => import('../pages/FinancePage').then((module) => ({ default: module.FinancePage })));
const ReportsPage = lazy(() => import('../pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const HelpCenterPage = lazy(() => import('../pages/HelpCenterPage').then((module) => ({ default: module.HelpCenterPage })));
const RestaurantPage = lazy(() => import('../pages/RestaurantPage').then((module) => ({ default: module.RestaurantPage })));
const RentalsPage = lazy(() => import('../pages/RentalsPage').then((module) => ({ default: module.RentalsPage })));
const AccountingPage = lazy(() => import('../pages/AccountingPage').then((module) => ({ default: module.AccountingPage })));
const StatementsPage = lazy(() => import('../pages/StatementsPage').then((module) => ({ default: module.StatementsPage })));
const ManufacturingPage = lazy(() => import('../pages/ManufacturingPage').then((module) => ({ default: module.ManufacturingPage })));

function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <AppErrorBoundary key={location.pathname}>{children}</AppErrorBoundary>;
}

export function AppRouter() {
  return (
    <BrowserRouter><LanguageProvider><AuthProvider><PlatformAuthProvider><RouteErrorBoundary><Suspense fallback={<AppLoader />}><Routes>
      <Route element={<AuthLayout />}><Route path="login" element={<LoginPage />} /></Route>
      <Route element={<ProtectedRoute />}><Route element={<DashboardLayout />}><Route index element={<DashboardPage />} /><Route path="restaurant" element={<RestaurantPage />} /><Route path="rentals" element={<RentalsPage />} /><Route path="manufacturing" element={<ManufacturingPage />} /><Route path="pos" element={<PointOfSalePage />} /><Route path="products" element={<ProductsPage />} /><Route path="inventory" element={<InventoryPage />} /><Route path="purchasing" element={<PurchasingPage />} /><Route path="suppliers" element={<PurchasingPage />} /><Route path="customers" element={<CustomersPage />} /><Route path="statements" element={<StatementsPage />} /><Route path="finance" element={<FinancePage />} /><Route path="accounting" element={<AccountingPage />} /><Route path="reports" element={<ReportsPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="help" element={<HelpCenterPage />} /><Route element={<TenantAdminRoute />}><Route path="branches" element={<BranchesPage />} /><Route path="team" element={<TeamPage />} /><Route path="subscription" element={<Navigate to="/settings" replace />} /></Route></Route></Route>
      <Route path="platform/login" element={<PlatformLoginPage />} />
      <Route element={<PlatformProtectedRoute />}><Route path="platform" element={<PlatformDashboardPage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense></RouteErrorBoundary></PlatformAuthProvider></AuthProvider></LanguageProvider></BrowserRouter>
  );
}

