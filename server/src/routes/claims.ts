import { Router } from 'express';
import { db } from '../db.js';
import { KNOWN_STYLIST_IDS } from '../stylistIds.js';

export const claimsRouter = Router();

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

const latestClaimStmt = db.prepare<[string], ClaimRow>(
  'SELECT * FROM claims WHERE stylist_id = ? ORDER BY id DESC LIMIT 1',
);

function latestClaim(stylistId: string): ClaimRow | undefined {
  return latestClaimStmt.get(stylistId);
}

// Public: the effective status + published overrides for every stylist, in
// one call, so the directory doesn't need N requests. Deliberately excludes
// owner_name/owner_contact/note — those are admin-only.
claimsRouter.get('/status', (_req, res) => {
  const rows = db.prepare<[], ClaimRow>('SELECT * FROM claims ORDER BY id DESC').all();
  const latestByStylist = new Map<string, ClaimRow>();
  for (const row of rows) {
    if (!latestByStylist.has(row.stylist_id)) latestByStylist.set(row.stylist_id, row);
  }

  const out: Record<string, unknown> = {};
  for (const [stylistId, row] of latestByStylist) {
    const status = row.status === 'rejected' ? 'unclaimed' : row.status;
    out[stylistId] =
      status === 'claimed'
        ? {
            status,
            specialty: row.specialty ?? undefined,
            price: row.price ?? undefined,
            services: row.services ? JSON.parse(row.services) : undefined,
            reply: row.reply ?? undefined,
          }
        : { status };
  }
  res.json(out);
});

claimsRouter.post('/', (req, res) => {
  const { stylistId, ownerName, ownerContact, note } = req.body ?? {};
  if (typeof stylistId !== 'string' || !KNOWN_STYLIST_IDS.has(stylistId)) {
    res.status(400).json({ error: 'Unknown stylistId' });
    return;
  }
  if (typeof ownerName !== 'string' || !ownerName.trim() || typeof ownerContact !== 'string' || !ownerContact.trim()) {
    res.status(400).json({ error: 'ownerName and ownerContact are required' });
    return;
  }

  const existing = latestClaim(stylistId);
  if (existing && existing.status !== 'rejected') {
    res.status(409).json({ error: `This profile is already ${existing.status}` });
    return;
  }

  db.prepare(
    `INSERT INTO claims (stylist_id, status, owner_name, owner_contact, note)
     VALUES (@stylistId, 'pending', @ownerName, @ownerContact, @note)`,
  ).run({ stylistId, ownerName: ownerName.trim(), ownerContact: ownerContact.trim(), note: note?.trim() || null });

  res.status(201).json({ status: 'pending' });
});

claimsRouter.post('/:stylistId/profile', (req, res) => {
  const { stylistId } = req.params;
  const claim = latestClaim(stylistId);
  if (!claim || claim.status !== 'claimed') {
    res.status(403).json({ error: 'This profile has not been claimed' });
    return;
  }

  const { specialty, price, services } = req.body ?? {};
  if (typeof specialty !== 'string' || typeof price !== 'string' || !Array.isArray(services)) {
    res.status(400).json({ error: 'specialty, price and services are required' });
    return;
  }

  db.prepare('UPDATE claims SET specialty = ?, price = ?, services = ? WHERE id = ?').run(
    specialty.trim(),
    price.trim(),
    JSON.stringify(services),
    claim.id,
  );
  res.json({ specialty: specialty.trim(), price: price.trim(), services });
});

claimsRouter.post('/:stylistId/reply', (req, res) => {
  const { stylistId } = req.params;
  const claim = latestClaim(stylistId);
  if (!claim || claim.status !== 'claimed') {
    res.status(403).json({ error: 'This profile has not been claimed' });
    return;
  }
  if (claim.reply) {
    res.status(409).json({ error: 'Already replied once' });
    return;
  }

  const { reply } = req.body ?? {};
  if (typeof reply !== 'string' || !reply.trim()) {
    res.status(400).json({ error: 'reply is required' });
    return;
  }

  db.prepare('UPDATE claims SET reply = ? WHERE id = ?').run(reply.trim(), claim.id);
  res.json({ reply: reply.trim() });
});
