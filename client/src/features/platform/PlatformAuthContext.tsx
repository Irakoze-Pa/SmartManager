import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getPlatformMe, platformLogin } from '../../services/platformService';
import type { PlatformAdmin } from '../../types/api';

interface PlatformAuthValue {
  admin: PlatformAdmin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
const PlatformAuthContext = createContext<PlatformAuthValue | null>(null);
const key = 'smartshop_platform_session';

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!window.localStorage.getItem(key)) { setLoading(false); return; }
    void getPlatformMe().then((result) => setAdmin(result.admin)).catch(() => window.localStorage.removeItem(key)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const expireSession = () => setAdmin(null);
    const syncSessionAcrossTabs = (event: StorageEvent) => {
      if (event.key === key && event.newValue === null) setAdmin(null);
    };
    window.addEventListener('smartshop:platform-session-expired', expireSession);
    window.addEventListener('storage', syncSessionAcrossTabs);
    return () => {
      window.removeEventListener('smartshop:platform-session-expired', expireSession);
      window.removeEventListener('storage', syncSessionAcrossTabs);
    };
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const result = await platformLogin(email, password);
    window.localStorage.setItem(key, result.token); setAdmin(result.admin);
  }, []);
  const logout = useCallback(() => { window.localStorage.removeItem(key); setAdmin(null); }, []);
  const value = useMemo(() => ({ admin, loading, login, logout }), [admin, loading, login, logout]);
  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}
export const usePlatformAuth = (): PlatformAuthValue => {
  const value = useContext(PlatformAuthContext);
  if (!value) throw new Error('usePlatformAuth must be used inside PlatformAuthProvider');
  return value;
};

