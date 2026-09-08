import { db } from './db.js';

function base(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'stylist'
  );
}

export function uniqueSlug(name: string): string {
  const root = base(name);
  const exists = db.prepare('SELECT 1 FROM stylists WHERE slug = ?');
  if (!exists.get(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!exists.get(candidate)) return candidate;
  }
}
