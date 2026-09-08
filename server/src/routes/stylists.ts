import { Router } from 'express';
import { db } from '../db.js';
import { requireStylist, signToken, verifyPassword, type AuthedRequest } from '../auth.js';

export const stylistsRouter = Router();

const CHAIRS = new Set(['travels', 'salon']);

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

function getStylistBySlug(slug: string): StylistRow | undefined {
  return db.prepare('SELECT * FROM stylists WHERE slug = ?').get(slug) as StylistRow | undefined;
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
stylistsRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.id, s.slug, s.name, s.area, s.chair, s.specialty, s.price, s.services,
        (SELECT COUNT(*) FROM reviews r WHERE r.stylist_id = s.id) AS review_count,
        (SELECT AVG(rating) FROM reviews r WHERE r.stylist_id = s.id) AS avg_rating,
        (SELECT answer_a FROM reviews r WHERE r.stylist_id = s.id ORDER BY r.id DESC LIMIT 1) AS latest_quote,
        (SELECT reply FROM reviews r WHERE r.stylist_id = s.id ORDER BY r.id DESC LIMIT 1) AS latest_reply
       FROM stylists s
       ORDER BY s.id DESC`,
    )
    .all() as (StylistRow & {
    review_count: number;
    avg_rating: number | null;
    latest_quote: string | null;
    latest_reply: string | null;
  })[];

  res.json(
    rows.map((r) => ({
      id: r.slug,
      name: r.name,
      area: r.area,
      chair: r.chair,
      specialty: r.specialty,
      price: r.price,
      services: JSON.parse(r.services) as string[],
      score: r.avg_rating ? Math.round(r.avg_rating * 10) / 10 : null,
      verified: r.review_count,
      quote: r.latest_quote,
      reply: r.latest_reply,
    })),
  );
});

stylistsRouter.get('/:slug/reviews', (req, res) => {
  const stylist = getStylistBySlug(req.params.slug);
  if (!stylist) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const rows = db
    .prepare('SELECT * FROM reviews WHERE stylist_id = ? ORDER BY id DESC')
    .all(stylist.id) as ReviewRow[];
  res.json(rows.map(toApiReview));
});

stylistsRouter.post('/:slug/reviews', (req, res) => {
  const stylist = getStylistBySlug(req.params.slug);
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

  const info = db
    .prepare(
      `INSERT INTO reviews (stylist_id, rating, services, paid, photos, answer_a, answer_b, answer_c)
       VALUES (@stylistId, @rating, @services, @paid, @photos, @a, @b, @c)`,
    )
    .run({
      stylistId: stylist.id,
      rating: Math.round(rating),
      services: JSON.stringify(services),
      paid: typeof paid === 'string' ? paid.trim() || null : null,
      photos: typeof photos === 'number' ? Math.max(0, Math.min(3, Math.round(photos))) : 0,
      a: a || null,
      b: b || null,
      c: c || null,
    });

  res.status(201).json({ id: info.lastInsertRowid });
});

stylistsRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const stylist = db.prepare('SELECT * FROM stylists WHERE email = ?').get(email.trim().toLowerCase()) as
    | StylistRow
    | undefined;

  if (!stylist || !verifyPassword(password, stylist.password_hash)) {
    res.status(401).json({ error: 'Wrong email or password' });
    return;
  }

  const token = signToken({ sub: stylist.id, email: stylist.email, role: 'stylist' });
  res.json({ token, slug: stylist.slug, name: stylist.name });
});

function assertOwnStylist(req: AuthedRequest, slug: string): StylistRow | null {
  const stylist = getStylistBySlug(slug);
  if (!stylist || stylist.id !== req.auth?.sub) return null;
  return stylist;
}

stylistsRouter.post('/:slug/profile', requireStylist, (req: AuthedRequest, res) => {
  const stylist = assertOwnStylist(req, String(req.params.slug));
  if (!stylist) {
    res.status(403).json({ error: "You can only edit your own profile" });
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

  db.prepare('UPDATE stylists SET area = ?, chair = ?, specialty = ?, price = ?, services = ? WHERE id = ?').run(
    area.trim(),
    chair,
    specialty.trim(),
    typeof price === 'string' ? price.trim() || null : null,
    JSON.stringify(services),
    stylist.id,
  );

  res.json({ ok: true });
});

stylistsRouter.post('/:slug/reviews/:reviewId/reply', requireStylist, (req: AuthedRequest, res) => {
  const stylist = assertOwnStylist(req, String(req.params.slug));
  if (!stylist) {
    res.status(403).json({ error: 'You can only reply on your own profile' });
    return;
  }

  const review = db.prepare('SELECT * FROM reviews WHERE id = ? AND stylist_id = ?').get(
    Number(req.params.reviewId),
    stylist.id,
  ) as ReviewRow | undefined;
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

  db.prepare('UPDATE reviews SET reply = ? WHERE id = ?').run(reply.trim(), review.id);
  res.json({ reply: reply.trim() });
});
