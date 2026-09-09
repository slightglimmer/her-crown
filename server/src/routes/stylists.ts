import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireStylist, signToken, verifyPassword, type AuthedRequest } from '../auth.js';
import { upload } from '../upload.js';

export const stylistsRouter = Router();

const CHAIRS = new Set(['travels', 'salon']);
const MAX_STYLIST_PHOTOS = 3;

interface StylistRow {
  id: number;
  slug: string;
  name: string;
  area: string;
  chair: string;
  specialty: string;
  price: string | null;
  services: string;
  email: string;
  password_hash: string;
}

interface ReviewRow {
  id: number;
  stylist_id: number;
  rating: number;
  services: string;
  paid: string | null;
  photos: number;
  answer_a: string | null;
  answer_b: string | null;
  answer_c: string | null;
  reply: string | null;
  created_at: string;
}

function getStylistBySlug(slug: string): Promise<StylistRow | undefined> {
  return queryOne<StylistRow>('SELECT * FROM stylists WHERE slug = $1', [slug]);
}

function toApiReview(row: ReviewRow) {
  return {
    id: row.id,
    rating: row.rating,
    services: JSON.parse(row.services) as string[],
    paid: row.paid,
    photos: row.photos,
    answers: { a: row.answer_a, b: row.answer_b, c: row.answer_c },
    reply: row.reply,
    createdAt: row.created_at,
  };
}

// Public: every real stylist, with review stats computed live from the
// reviews table — there is no seed data and no invented scores, so a
// stylist with zero reviews shows 0/none rather than a fabricated number.
stylistsRouter.get('/', async (_req, res) => {
  const rows = await query<
    StylistRow & {
      review_count: string;
      avg_rating: string | null;
      latest_quote: string | null;
      latest_reply: string | null;
      has_photo: boolean;
    }
  >(`
    SELECT s.id, s.slug, s.name, s.area, s.chair, s.specialty, s.price, s.services,
      EXISTS (SELECT 1 FROM stylist_photos sp WHERE sp.stylist_id = s.id) AS has_photo,
      (SELECT COUNT(*) FROM reviews r WHERE r.stylist_id = s.id) AS review_count,
      (SELECT AVG(rating) FROM reviews r WHERE r.stylist_id = s.id) AS avg_rating,
      (SELECT answer_a FROM reviews r WHERE r.stylist_id = s.id ORDER BY r.id DESC LIMIT 1) AS latest_quote,
      (SELECT reply FROM reviews r WHERE r.stylist_id = s.id ORDER BY r.id DESC LIMIT 1) AS latest_reply
     FROM stylists s
     ORDER BY s.id DESC
  `);

  res.json(
    rows.map((r) => {
      const avg = r.avg_rating !== null ? Number(r.avg_rating) : null;
      return {
        id: r.slug,
        name: r.name,
        area: r.area,
        chair: r.chair,
        specialty: r.specialty,
        price: r.price,
        services: JSON.parse(r.services) as string[],
        score: avg !== null ? Math.round(avg * 10) / 10 : null,
        verified: Number(r.review_count),
        quote: r.latest_quote,
        reply: r.latest_reply,
        hasPhoto: r.has_photo,
      };
    }),
  );
});

stylistsRouter.get('/:slug/reviews', async (req, res) => {
  const stylist = await getStylistBySlug(req.params.slug);
  if (!stylist) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const rows = await query<ReviewRow>('SELECT * FROM reviews WHERE stylist_id = $1 ORDER BY id DESC', [stylist.id]);
  res.json(rows.map(toApiReview));
});

stylistsRouter.post('/:slug/reviews', async (req, res) => {
  const stylist = await getStylistBySlug(req.params.slug);
  if (!stylist) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { rating, services, paid, photos, answers } = req.body ?? {};
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'rating must be 1-5' });
    return;
  }
  if (!Array.isArray(services) || services.length === 0) {
    res.status(400).json({ error: 'pick at least one service' });
    return;
  }
  const a = typeof answers?.a === 'string' ? answers.a.trim() : '';
  const b = typeof answers?.b === 'string' ? answers.b.trim() : '';
  const c = typeof answers?.c === 'string' ? answers.c.trim() : '';
  const words = [a, b, c].join(' ').trim().split(/\s+/).filter(Boolean).length;
  if (words < 25) {
    res.status(400).json({ error: 'write-up needs at least 25 words' });
    return;
  }

  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO reviews (stylist_id, rating, services, paid, photos, answer_a, answer_b, answer_c)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      stylist.id,
      Math.round(rating),
      JSON.stringify(services),
      typeof paid === 'string' ? paid.trim() || null : null,
      typeof photos === 'number' ? Math.max(0, Math.min(3, Math.round(photos))) : 0,
      a || null,
      b || null,
      c || null,
    ],
  );

  res.status(201).json({ id: inserted?.id });
});

stylistsRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const stylist = await queryOne<StylistRow>('SELECT * FROM stylists WHERE email = $1', [email.trim().toLowerCase()]);

  if (!stylist || !verifyPassword(password, stylist.password_hash)) {
    res.status(401).json({ error: 'Wrong email or password' });
    return;
  }

  const token = signToken({ sub: stylist.id, email: stylist.email, role: 'stylist' });
  res.json({ token, slug: stylist.slug, name: stylist.name });
});

async function assertOwnStylist(req: AuthedRequest, slug: string): Promise<StylistRow | null> {
  const stylist = await getStylistBySlug(slug);
  if (!stylist || stylist.id !== req.auth?.sub) return null;
  return stylist;
}

stylistsRouter.post('/:slug/profile', requireStylist, async (req: AuthedRequest, res) => {
  const stylist = await assertOwnStylist(req, String(req.params.slug));
  if (!stylist) {
    res.status(403).json({ error: 'You can only edit your own profile' });
    return;
  }

  const { area, chair, specialty, price, services } = req.body ?? {};
  if (typeof area !== 'string' || !area.trim()) {
    res.status(400).json({ error: 'area is required' });
    return;
  }
  if (typeof chair !== 'string' || !CHAIRS.has(chair)) {
    res.status(400).json({ error: "chair must be 'travels' or 'salon'" });
    return;
  }
  if (typeof specialty !== 'string' || !specialty.trim()) {
    res.status(400).json({ error: 'specialty is required' });
    return;
  }
  if (!Array.isArray(services) || services.length === 0) {
    res.status(400).json({ error: 'pick at least one service' });
    return;
  }

  await query('UPDATE stylists SET area = $1, chair = $2, specialty = $3, price = $4, services = $5 WHERE id = $6', [
    area.trim(),
    chair,
    specialty.trim(),
    typeof price === 'string' ? price.trim() || null : null,
    JSON.stringify(services),
    stylist.id,
  ]);

  res.json({ ok: true });
});

stylistsRouter.post('/:slug/reviews/:reviewId/reply', requireStylist, async (req: AuthedRequest, res) => {
  const stylist = await assertOwnStylist(req, String(req.params.slug));
  if (!stylist) {
    res.status(403).json({ error: 'You can only reply on your own profile' });
    return;
  }

  const review = await queryOne<ReviewRow>('SELECT * FROM reviews WHERE id = $1 AND stylist_id = $2', [
    Number(req.params.reviewId),
    stylist.id,
  ]);
  if (!review) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (review.reply) {
    res.status(409).json({ error: 'Already replied once' });
    return;
  }

  const { reply } = req.body ?? {};
  if (typeof reply !== 'string' || !reply.trim()) {
    res.status(400).json({ error: 'reply is required' });
    return;
  }

  await query('UPDATE reviews SET reply = $1 WHERE id = $2', [reply.trim(), review.id]);
  res.json({ reply: reply.trim() });
});

// Public: the cover photo (lowest id) as raw bytes, so a plain <img src>
// works with no auth — this is what the directory, rec cards and review
// picker show.
stylistsRouter.get('/:slug/photo', async (req, res) => {
  const stylist = await getStylistBySlug(req.params.slug);
  if (!stylist) {
    res.status(404).end();
    return;
  }
  const row = await queryOne<{ data: Buffer; mime_type: string }>(
    'SELECT data, mime_type FROM stylist_photos WHERE stylist_id = $1 ORDER BY id ASC LIMIT 1',
    [stylist.id],
  );
  if (!row) {
    res.status(404).end();
    return;
  }
  res.setHeader('Content-Type', row.mime_type);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(row.data);
});

// Public: the gallery listing and individual photos — not sensitive, so no
// auth needed to view (only to add/remove).
stylistsRouter.get('/:slug/photos', async (req, res) => {
  const stylist = await getStylistBySlug(req.params.slug);
  if (!stylist) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const rows = await query<{ id: number; mime_type: string }>(
    'SELECT id, mime_type FROM stylist_photos WHERE stylist_id = $1 ORDER BY id ASC',
    [stylist.id],
  );
  res.json(rows.map((r) => ({ id: r.id, mimeType: r.mime_type })));
});

stylistsRouter.get('/:slug/photos/:photoId', async (req, res) => {
  const stylist = await getStylistBySlug(req.params.slug);
  if (!stylist) {
    res.status(404).end();
    return;
  }
  const row = await queryOne<{ data: Buffer; mime_type: string }>(
    'SELECT data, mime_type FROM stylist_photos WHERE id = $1 AND stylist_id = $2',
    [Number(req.params.photoId), stylist.id],
  );
  if (!row) {
    res.status(404).end();
    return;
  }
  res.setHeader('Content-Type', row.mime_type);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(row.data);
});

stylistsRouter.post('/:slug/photos', requireStylist, upload.array('photos', MAX_STYLIST_PHOTOS), async (req: AuthedRequest, res) => {
  const stylist = await assertOwnStylist(req, String(req.params.slug));
  if (!stylist) {
    res.status(403).json({ error: 'You can only edit your own profile' });
    return;
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: 'photo is required' });
    return;
  }

  const existing = await queryOne<{ count: string }>('SELECT COUNT(*) AS count FROM stylist_photos WHERE stylist_id = $1', [
    stylist.id,
  ]);
  if (Number(existing?.count ?? 0) + files.length > MAX_STYLIST_PHOTOS) {
    res.status(400).json({ error: `Up to ${MAX_STYLIST_PHOTOS} photos total` });
    return;
  }

  for (const file of files) {
    await query('INSERT INTO stylist_photos (stylist_id, data, mime_type) VALUES ($1, $2, $3)', [
      stylist.id,
      file.buffer,
      file.mimetype,
    ]);
  }

  res.status(201).json({ ok: true });
});

stylistsRouter.delete('/:slug/photos/:photoId', requireStylist, async (req: AuthedRequest, res) => {
  const stylist = await assertOwnStylist(req, String(req.params.slug));
  if (!stylist) {
    res.status(403).json({ error: 'You can only edit your own profile' });
    return;
  }

  const result = await query('DELETE FROM stylist_photos WHERE id = $1 AND stylist_id = $2 RETURNING id', [
    Number(req.params.photoId),
    stylist.id,
  ]);
  if (result.length === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.json({ ok: true });
});
