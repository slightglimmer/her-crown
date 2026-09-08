import { db } from './db.js';
import { hashPassword } from './auth.js';

// Auto-creates the admin account on first boot when a host (e.g. Render)
// can't easily run `npm run seed:admin` as a one-off shell command. Only
// fires when the table is empty — it never overwrites an existing account,
// unlike the explicit seed:admin script, which is for deliberately rotating
// a password.
export function ensureAdminSeeded() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const { n } = db.prepare('SELECT COUNT(*) AS n FROM admin_users').get() as { n: number };
  if (n > 0) return;

  db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').run(email, hashPassword(password));
  console.log(`Admin account auto-created for ${email}.`);
}
