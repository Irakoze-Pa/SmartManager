import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAuth } from './PlatformAuthContext';
import { AppLoader } from '../../components/AppLoader';

export function PlatformProtectedRoute() {
  const { admin, loading } = usePlatformAuth();
  if (loading) return <AppLoader message="Verifying platform access" />;
  return admin ? <Outlet /> : <Navigate to="/platform/login" replace />;
}

