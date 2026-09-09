import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — copy .env.example to .env and fill it in (a free Postgres from neon.tech works).');
}

// Neon (and most hosted Postgres) require TLS but present a cert chain
// `pg`'s default strict verification won't walk — this matches what every
// serverless-Postgres quickstart recommends.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = unknown>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    );

    -- A stylist's real, live profile — created only when an application is
    -- approved. email/password_hash double as that stylist's own login.
    CREATE TABLE IF NOT EXISTS stylists (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      chair TEXT NOT NULL CHECK (chair IN ('travels', 'salon')),
      specialty TEXT NOT NULL,
      price TEXT,
      services TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    );

    -- A signup application. Holds its own copy of the profile fields and
    -- credentials; approval copies them into a new stylists row.
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      chair TEXT NOT NULL CHECK (chair IN ('travels', 'salon')),
      specialty TEXT NOT NULL,
      price TEXT,
      services TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      note TEXT,
      stylist_id INTEGER REFERENCES stylists (id),
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      decided_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      stylist_id INTEGER NOT NULL REFERENCES stylists (id),
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      services TEXT NOT NULL,
      paid TEXT,
      photos INTEGER NOT NULL DEFAULT 0,
      answer_a TEXT,
      answer_b TEXT,
      answer_c TEXT,
      reply TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_stylist ON reviews (stylist_id, id DESC);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status, id DESC);
  `);
}
