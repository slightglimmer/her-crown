import 'dotenv/config';
import { db } from './db.js';
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

const passwordHash = hashPassword(password);

db.prepare(
  `INSERT INTO admin_users (email, password_hash) VALUES (@email, @passwordHash)
   ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash`,
).run({ email, passwordHash });

console.log(`Admin account ready for ${email}.`);
