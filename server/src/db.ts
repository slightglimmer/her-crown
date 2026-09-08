import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// DATA_DIR lets a host mount a persistent disk somewhere of its choosing
// (e.g. Render) instead of the project's own folder, which doesn't survive
// redeploys.
const dataDir = process.env.DATA_DIR ?? join(here, '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new Database(join(dataDir, 'her-crown.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- A stylist's real, live profile — created only when an application is
  -- approved. email/password_hash double as that stylist's own login.
  CREATE TABLE IF NOT EXISTS stylists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    chair TEXT NOT NULL CHECK (chair IN ('travels', 'salon')),
    specialty TEXT NOT NULL,
    price TEXT,
    services TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- A signup application. Holds its own copy of the profile fields and
  -- credentials; approval copies them into a new stylists row.
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    decided_at TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stylist_id INTEGER NOT NULL REFERENCES stylists (id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    services TEXT NOT NULL,
    paid TEXT,
    photos INTEGER NOT NULL DEFAULT 0,
    answer_a TEXT,
    answer_b TEXT,
    answer_c TEXT,
    reply TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_stylist ON reviews (stylist_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status, id DESC);
`);
