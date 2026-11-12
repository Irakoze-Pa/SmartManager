import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function TenantAdminRoute() {
  const { identity } = useAuth();
  return identity?.user.role === 'owner' || identity?.user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
