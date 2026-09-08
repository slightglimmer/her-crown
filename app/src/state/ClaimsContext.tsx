import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Stylist } from '../data/stylists';

// Claims are real, backend-held state now (see server/) — anyone can submit
// one, and only the logged-in admin account can see/approve them. The public
// status endpoint deliberately omits owner name/contact/note; those are
// admin-only. This context just wraps that API for the rest of the app.

export type ClaimStatus = 'unclaimed' | 'pending' | 'claimed';

export interface PublicClaimInfo {
  status: ClaimStatus;
  specialty?: string;
  price?: string;
  services?: string[];
  reply?: string;
}

type StatusMap = Record<string, PublicClaimInfo>;

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4787';

const UNCLAIMED: PublicClaimInfo = { status: 'unclaimed' };

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

interface ClaimsContextValue {
  loading: boolean;
  loadError: string | null;
  getClaim: (stylistId: string) => PublicClaimInfo;
  effectiveStylist: (stylist: Stylist) => Stylist;
  submitClaim: (stylistId: string, info: { ownerName: string; ownerContact: string; note?: string }) => Promise<void>;
  updateProfile: (stylistId: string, fields: { specialty: string; price: string; services: string[] }) => Promise<void>;
  submitReply: (stylistId: string, reply: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ClaimsContext = createContext<ClaimsContextValue | null>(null);

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/claims/status')) as StatusMap;
      setStatusMap(data);
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

  const value = useMemo<ClaimsContextValue>(
    () => ({
      loading,
      loadError,
      getClaim: (stylistId) => statusMap[stylistId] ?? UNCLAIMED,
      effectiveStylist: (stylist) => {
        const c = statusMap[stylist.id];
        if (!c || c.status !== 'claimed') return stylist;
        return {
          ...stylist,
          specialty: c.specialty ?? stylist.specialty,
          price: c.price ?? stylist.price,
          services: c.services ?? stylist.services,
        };
      },
      submitClaim: async (stylistId, info) => {
        await apiFetch('/api/claims', { method: 'POST', body: JSON.stringify({ stylistId, ...info }) });
        await refresh();
      },
      updateProfile: async (stylistId, fields) => {
        await apiFetch(`/api/claims/${stylistId}/profile`, { method: 'POST', body: JSON.stringify(fields) });
        await refresh();
      },
      submitReply: async (stylistId, reply) => {
        await apiFetch(`/api/claims/${stylistId}/reply`, { method: 'POST', body: JSON.stringify({ reply }) });
        await refresh();
      },
      refresh,
    }),
    [statusMap, loading, loadError, refresh],
  );

  return <ClaimsContext.Provider value={value}>{children}</ClaimsContext.Provider>;
}

export function useClaims() {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error('useClaims must be used within a ClaimsProvider');
  return ctx;
}
