export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4787';

export async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body;
}

export function stylistPhotoUrl(slug: string): string {
  return `${API_BASE}/api/stylists/${slug}/photo`;
}
