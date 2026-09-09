import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSchema } from './db.js';
import { ensureAdminSeeded } from './ensureAdmin.js';
import { UploadError } from './upload.js';
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

// Must come last: catches multer's upload errors (bad file type, too big)
// and reports them as clean 400s instead of Express's default HTML error
// page. Anything else unexpected becomes a generic 500 — no internals leak.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5MB' : err.message;
    res.status(400).json({ error: message });
    return;
  }
  if (err instanceof UploadError) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(port, () => {
  console.log(`Her Crown API listening on http://localhost:${port}`);
});
