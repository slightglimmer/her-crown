import { queryOne } from './db.js';

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

export async function uniqueSlug(name: string): Promise<string> {
  const root = base(name);
  if (!(await queryOne('SELECT 1 FROM stylists WHERE slug = $1', [root]))) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!(await queryOne('SELECT 1 FROM stylists WHERE slug = $1', [candidate]))) return candidate;
  }
}
