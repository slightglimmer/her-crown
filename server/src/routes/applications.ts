import { Router } from 'express';
import { db } from '../db.js';
import { hashPassword } from '../auth.js';
import { notifyNewApplication } from '../email.js';

export const applicationsRouter = Router();

const CHAIRS = new Set(['travels', 'salon']);

applicationsRouter.post('/', (req, res) => {
  const { name, area, chair, specialty, price, services, email, password, note } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
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
  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'a valid email is required' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailTaken =
    db.prepare('SELECT 1 FROM stylists WHERE email = ?').get(normalizedEmail) ||
    db.prepare("SELECT 1 FROM applications WHERE email = ? AND status = 'pending'").get(normalizedEmail);
  if (emailTaken) {
    res.status(409).json({ error: 'That email already has an account or a pending application' });
    return;
  }

  const trimmedName = name.trim();
  const trimmedArea = area.trim();
  const trimmedSpecialty = specialty.trim();
  const trimmedNote = typeof note === 'string' ? note.trim() || null : null;

  db.prepare(
    `INSERT INTO applications (status, name, area, chair, specialty, price, services, email, password_hash, note)
     VALUES ('pending', @name, @area, @chair, @specialty, @price, @services, @email, @passwordHash, @note)`,
  ).run({
    name: trimmedName,
    area: trimmedArea,
    chair,
    specialty: trimmedSpecialty,
    price: typeof price === 'string' ? price.trim() || null : null,
    services: JSON.stringify(services),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    note: trimmedNote,
  });

  res.status(201).json({ status: 'pending' });

  // Fire-and-forget: the application is already saved, so a slow or failed
  // notification shouldn't hold up the applicant's response.
  notifyNewApplication({
    name: trimmedName,
    area: trimmedArea,
    specialty: trimmedSpecialty,
    email: normalizedEmail,
    note: trimmedNote,
  });
});
