import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCurrentIdentity, login as loginRequest } from '../../services/authService';
import type { Identity, LoginRequest } from '../../types/api';

interface AuthContextValue {
  identity: Identity | null;
  isLoading: boolean;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshIdentity: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenKey = 'smartshop_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) {
      setIsLoading(false);
      return;
    }
    void getCurrentIdentity()
      .then(setIdentity)
      .catch(() => window.localStorage.removeItem(tokenKey))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const expireSession = () => setIdentity(null);
    const syncSessionAcrossTabs = (event: StorageEvent) => {
      if (event.key === tokenKey && event.newValue === null) setIdentity(null);
    };
    window.addEventListener('smartshop:tenant-session-expired', expireSession);
    window.addEventListener('storage', syncSessionAcrossTabs);
    return () => {
      window.removeEventListener('smartshop:tenant-session-expired', expireSession);
      window.removeEventListener('storage', syncSessionAcrossTabs);
    };
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    const [request] = await Promise.allSettled([loginRequest(input), new Promise((resolve) => window.setTimeout(resolve, 3_000))]);
    if (request.status === 'rejected') throw request.reason;
    const result = request.value;
    window.localStorage.setItem(tokenKey, result.token);
    setIdentity({ user: result.user, business: result.business, branch: result.branch });
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(tokenKey);
    setIdentity(null);
  }, []);
  const refreshIdentity = useCallback(async () => { setIdentity(await getCurrentIdentity()); }, []);

  const value = useMemo(() => ({ identity, isLoading, login, logout, refreshIdentity }), [identity, isLoading, login, logout, refreshIdentity]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

