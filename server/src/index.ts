import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSchema } from './db.js';
import { ensureAdminSeeded } from './ensureAdmin.js';
import { applicationsRouter } from './routes/applications.js';
import { stylistsRouter } from './routes/stylists.js';
import { adminRouter } from './routes/admin.js';

await initSchema();
await ensureAdminSeeded();

const app = express();
const port = Number(process.env.PORT ?? 4787);
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5183').split(',').map((s) => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/applications', applicationsRouter);
app.use('/api/stylists', stylistsRouter);
app.use('/api/admin', adminRouter);

// Serves the built frontend (app/dist) on this same port when it exists, so
// the whole site — UI and API — is reachable behind one URL/tunnel. In dev,
// the frontend usually runs separately via `npm run dev` in app/ instead.
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(here, '..', '..', 'app', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Her Crown API listening on http://localhost:${port}`);
});
