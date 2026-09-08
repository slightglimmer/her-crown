import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { API_BASE } from '../api/http';

const STORAGE_KEY = 'her-crown-stylist-session';

interface Session {
  token: string;
  slug: string;
  name: string;
}

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

interface StylistAuthContextValue {
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  stylistFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}

const StylistAuthContext = createContext<StylistAuthContextValue | null>(null);

export function StylistAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession);

  const logout = useCallback(() => {
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/stylists/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? 'Login failed');
    const next: Session = { token: body.token, slug: body.slug, name: body.name };
    setSession(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const stylistFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!session) throw new Error('Not logged in');
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}`, ...init?.headers },
      });
      if (res.status === 401) {
        logout();
        throw new Error('Session expired — please log in again');
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      return body;
    },
    [session, logout],
  );

  const value = useMemo(() => ({ session, login, logout, stylistFetch }), [session, login, logout, stylistFetch]);

  return <StylistAuthContext.Provider value={value}>{children}</StylistAuthContext.Provider>;
}

export function useStylistAuth() {
  const ctx = useContext(StylistAuthContext);
  if (!ctx) throw new Error('useStylistAuth must be used within a StylistAuthProvider');
  return ctx;
}
