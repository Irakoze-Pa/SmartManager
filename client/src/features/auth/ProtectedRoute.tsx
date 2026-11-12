import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AppLoader } from '../../components/AppLoader';

export function ProtectedRoute() {
  const { identity, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <AppLoader message="Restoring your secure session" />;
  return identity ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

