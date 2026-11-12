import { useEffect, useState } from 'react';
import { getHealth } from '../services/healthService';

export type ApiHealthState = 'checking' | 'online' | 'degraded' | 'offline';

export const useApiHealth = (): ApiHealthState => {
  const [state, setState] = useState<ApiHealthState>('checking');

  useEffect(() => {
    let isActive = true;

    void getHealth()
      .then((health) => {
        if (isActive) setState(health.database === 'connected' ? 'online' : 'degraded');
      })
      .catch(() => {
        if (isActive) setState('offline');
      });

    return () => {
      isActive = false;
    };
  }, []);

  return state;
};

