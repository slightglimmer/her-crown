import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4787';
const STORAGE_KEY = 'her-crown-admin-session';

interface Session {
  token: string;
  email: string;
}

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

interface AdminAuthContextValue {
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  adminFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession);

  const logout = useCallback(() => {
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? 'Login failed');
    const next: Session = { token: body.token, email: body.email };
    setSession(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const adminFetch = useCallback(
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

  const value = useMemo(() => ({ session, login, logout, adminFetch }), [session, login, logout, adminFetch]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
}
