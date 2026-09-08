import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '../api/http';
import type { Stylist } from '../data/stylists';

interface StylistsContextValue {
  stylists: Stylist[];
  loading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
}

const StylistsContext = createContext<StylistsContextValue | null>(null);

export function StylistsProvider({ children }: { children: ReactNode }) {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/stylists')) as Stylist[];
      setStylists(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ stylists, loading, loadError, refresh }), [stylists, loading, loadError, refresh]);

  return <StylistsContext.Provider value={value}>{children}</StylistsContext.Provider>;
}

export function useStylists() {
  const ctx = useContext(StylistsContext);
  if (!ctx) throw new Error('useStylists must be used within a StylistsProvider');
  return ctx;
}
