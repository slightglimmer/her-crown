import 'dotenv/config';
import { pool, query, initSchema } from './db.js';
import { hashPassword } from './auth.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first (copy .env.example).');
  process.exit(1);
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD should be at least 8 characters.');
  process.exit(1);
}

await initSchema();

await query(
  `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
   ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash`,
  [email, hashPassword(password)],
);

console.log(`Admin account ready for ${email}.`);
await pool.end();
