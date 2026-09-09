import { Router } from 'express';
import { query, queryOne, withTransaction } from '../db.js';
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

adminRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await queryOne<AdminUserRow>('SELECT * FROM admin_users WHERE email = $1', [email.trim().toLowerCase()]);

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Wrong email or password' });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email, role: 'admin' });
  res.json({ token, email: user.email });
});

adminRouter.use(requireAdmin);

adminRouter.get('/applications', async (req: AuthedRequest, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const rows = await query<ApplicationRow & { stylist_slug: string | null }>(
    status ? `${APPLICATION_SELECT} WHERE a.status = $1 ORDER BY a.id DESC` : `${APPLICATION_SELECT} ORDER BY a.id DESC`,
    status ? [status] : [],
  );
  res.json(rows.map(toApiApplication));
});

adminRouter.post('/applications/:id/approve', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const app = await queryOne<ApplicationRow>('SELECT * FROM applications WHERE id = $1', [id]);
  if (!app) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (app.status !== 'pending') {
    res.status(409).json({ error: `Already ${app.status}` });
    return;
  }

  const slug = await uniqueSlug(app.name);

  await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO stylists (slug, name, area, chair, specialty, price, services, email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [slug, app.name, app.area, app.chair, app.specialty, app.price, app.services, app.email, app.password_hash],
    );
    const stylistId = inserted.rows[0].id;

    await client.query(
      "UPDATE applications SET status = 'approved', decided_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS'), stylist_id = $1 WHERE id = $2",
      [stylistId, id],
    );
  });

  const updated = await queryOne<ApplicationRow>('SELECT * FROM applications WHERE id = $1', [id]);
  res.json(toApiApplication(updated!));
});

adminRouter.post('/applications/:id/reject', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const result = await query(
    "UPDATE applications SET status = 'rejected', decided_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = $1 AND status = 'pending' RETURNING id",
    [id],
  );
  if (result.length === 0) {
    res.status(404).json({ error: 'Not found or already decided' });
    return;
  }
  const updated = await queryOne<ApplicationRow>('SELECT * FROM applications WHERE id = $1', [id]);
  res.json(toApiApplication(updated!));
});

// Fully removes a listing — their reviews, the application record that
// created them, and the stylist row itself. Used for cleaning up test/wrong
// listings; there's no "soft delete" here, so this can't be undone.
adminRouter.delete('/stylists/:slug', async (req: AuthedRequest, res) => {
  const stylist = await queryOne<StylistRow>('SELECT * FROM stylists WHERE slug = $1', [req.params.slug]);
  if (!stylist) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  await withTransaction(async (client) => {
    await client.query('DELETE FROM reviews WHERE stylist_id = $1', [stylist.id]);
    await client.query(
      'DELETE FROM application_photos WHERE application_id IN (SELECT id FROM applications WHERE stylist_id = $1)',
      [stylist.id],
    );
    await client.query('DELETE FROM applications WHERE stylist_id = $1', [stylist.id]);
    await client.query('DELETE FROM stylists WHERE id = $1', [stylist.id]);
  });

  res.json({ ok: true });
});

adminRouter.get('/applications/:id/photos', async (req: AuthedRequest, res) => {
  const rows = await query<{ id: number; mime_type: string }>(
    'SELECT id, mime_type FROM application_photos WHERE application_id = $1 ORDER BY id',
    [Number(req.params.id)],
  );
  res.json(rows.map((r) => ({ id: r.id, mimeType: r.mime_type })));
});

adminRouter.get('/applications/:id/photos/:photoId', async (req: AuthedRequest, res) => {
  const row = await queryOne<{ data: Buffer; mime_type: string }>(
    'SELECT data, mime_type FROM application_photos WHERE id = $1 AND application_id = $2',
    [Number(req.params.photoId), Number(req.params.id)],
  );
  if (!row) {
    res.status(404).end();
    return;
  }
  res.setHeader('Content-Type', row.mime_type);
  res.send(row.data);
});
