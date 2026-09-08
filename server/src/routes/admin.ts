import { Router } from 'express';
import { db } from '../db.js';
import { signAdminToken, verifyPassword, requireAdmin, type AuthedRequest } from '../auth.js';

export const adminRouter = Router();

interface AdminUserRow {
  id: number;
  email: string;
  password_hash: string;
}

interface ClaimRow {
  id: number;
  stylist_id: string;
  status: 'pending' | 'claimed' | 'rejected';
  owner_name: string;
  owner_contact: string;
  note: string | null;
  specialty: string | null;
  price: string | null;
  services: string | null;
  reply: string | null;
  created_at: string;
  decided_at: string | null;
}

function toApiClaim(row: ClaimRow) {
  return {
    id: row.id,
    stylistId: row.stylist_id,
    status: row.status,
    ownerName: row.owner_name,
    ownerContact: row.owner_contact,
    note: row.note,
    specialty: row.specialty,
    price: row.price,
    services: row.services ? JSON.parse(row.services) : null,
    reply: row.reply,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

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

  const token = signAdminToken({ sub: user.id, email: user.email });
  res.json({ token, email: user.email });
});

adminRouter.use(requireAdmin);

adminRouter.get('/claims', (req: AuthedRequest, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const rows = (
    status
      ? db.prepare('SELECT * FROM claims WHERE status = ? ORDER BY id DESC').all(status)
      : db.prepare('SELECT * FROM claims ORDER BY id DESC').all()
  ) as ClaimRow[];
  res.json(rows.map(toApiClaim));
});

function decide(id: number, status: 'claimed' | 'rejected'): ClaimRow | undefined {
  const info = db.prepare("UPDATE claims SET status = ?, decided_at = datetime('now') WHERE id = ?").run(status, id);
  if (info.changes === 0) return undefined;
  return db.prepare('SELECT * FROM claims WHERE id = ?').get(id) as ClaimRow;
}

adminRouter.post('/claims/:id/approve', (req: AuthedRequest, res) => {
  const claim = decide(Number(req.params.id), 'claimed');
  if (!claim) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(toApiClaim(claim));
});

adminRouter.post('/claims/:id/reject', (req: AuthedRequest, res) => {
  const claim = decide(Number(req.params.id), 'rejected');
  if (!claim) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(toApiClaim(claim));
});
