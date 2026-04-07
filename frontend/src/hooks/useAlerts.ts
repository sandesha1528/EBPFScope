import { useState, useCallback, useEffect } from 'react';
import { AlertEvent } from '../types';

export interface UIAlert extends AlertEvent {
  id: number;
  timestamp: number;
}

export function useAlerts(newAlerts: AlertEvent[] = []) {
  const [alerts, setAlerts] = useState<UIAlert[]>([]);

  useEffect(() => {
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const now = Date.now();
        const incoming = newAlerts.map((a, i) => ({ ...a, id: now + i, timestamp: now }));
        return [...incoming, ...prev].slice(0, 100);
      });
    }
  }, [newAlerts]);

  const dismissAlert = useCallback((id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return { alerts, dismissAlert };
}
