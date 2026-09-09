import { Router } from 'express';
import { db } from '../db.js';
import { signToken, verifyPassword, requireAdmin, type AuthedRequest } from '../auth.js';
import { uniqueSlug } from '../slug.js';

export const adminRouter = Router();

interface AdminUserRow {
  id: number;
  email: string;
  password_hash: string;
}

interface ApplicationRow {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  name: string;
  area: string;
  chair: string;
  specialty: string;
  price: string | null;
  services: string;
  email: string;
  password_hash: string;
  note: string | null;
  stylist_id: number | null;
  created_at: string;
  decided_at: string | null;
}

interface StylistRow {
  id: number;
  slug: string;
}

function toApiApplication(row: ApplicationRow & { stylist_slug?: string | null }) {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    area: row.area,
    chair: row.chair,
    specialty: row.specialty,
    price: row.price,
    services: JSON.parse(row.services) as string[],
    email: row.email,
    note: row.note,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    stylistSlug: row.stylist_slug ?? null,
  };
}

const APPLICATION_SELECT = `
  SELECT a.*, s.slug AS stylist_slug
  FROM applications a
  LEFT JOIN stylists s ON s.id = a.stylist_id
`;

adminRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM admin_users WHERE email = ?')
    .get(email.trim().toLowerCase()) as AdminUserRow | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Wrong email or password' });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email, role: 'admin' });
  res.json({ token, email: user.email });
});

adminRouter.use(requireAdmin);

adminRouter.get('/applications', (req: AuthedRequest, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const rows = (
    status
      ? db.prepare(`${APPLICATION_SELECT} WHERE a.status = ? ORDER BY a.id DESC`).all(status)
      : db.prepare(`${APPLICATION_SELECT} ORDER BY a.id DESC`).all()
  ) as (ApplicationRow & { stylist_slug: string | null })[];
  res.json(rows.map(toApiApplication));
});

adminRouter.post('/applications/:id/approve', (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as ApplicationRow | undefined;
  if (!app) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (app.status !== 'pending') {
    res.status(409).json({ error: `Already ${app.status}` });
    return;
  }

  const slug = uniqueSlug(app.name);

  const tx = db.transaction(() => {
    const stylistInfo = db
      .prepare(
        `INSERT INTO stylists (slug, name, area, chair, specialty, price, services, email, password_hash)
         VALUES (@slug, @name, @area, @chair, @specialty, @price, @services, @email, @passwordHash)`,
      )
      .run({
        slug,
        name: app.name,
        area: app.area,
        chair: app.chair,
        specialty: app.specialty,
        price: app.price,
        services: app.services,
        email: app.email,
        passwordHash: app.password_hash,
      });

    db.prepare(
      "UPDATE applications SET status = 'approved', decided_at = datetime('now'), stylist_id = ? WHERE id = ?",
    ).run(stylistInfo.lastInsertRowid, id);
  });
  tx();

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as ApplicationRow;
  res.json(toApiApplication(updated));
});

adminRouter.post('/applications/:id/reject', (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const info = db
    .prepare("UPDATE applications SET status = 'rejected', decided_at = datetime('now') WHERE id = ? AND status = 'pending'")
    .run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Not found or already decided' });
    return;
  }
  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as ApplicationRow;
  res.json(toApiApplication(updated));
});

// Fully removes a listing — their reviews, the application record that
// created them, and the stylist row itself. Used for cleaning up test/wrong
// listings; there's no "soft delete" here, so this can't be undone.
adminRouter.delete('/stylists/:slug', (req: AuthedRequest, res) => {
  const stylist = db.prepare('SELECT * FROM stylists WHERE slug = ?').get(req.params.slug) as StylistRow | undefined;
  if (!stylist) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM reviews WHERE stylist_id = ?').run(stylist.id);
    db.prepare('DELETE FROM applications WHERE stylist_id = ?').run(stylist.id);
    db.prepare('DELETE FROM stylists WHERE id = ?').run(stylist.id);
  });
  tx();

  res.json({ ok: true });
});
