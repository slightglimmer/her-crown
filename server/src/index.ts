import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import './db.js';
import { applicationsRouter } from './routes/applications.js';
import { stylistsRouter } from './routes/stylists.js';
import { adminRouter } from './routes/admin.js';

const app = express();
const port = Number(process.env.PORT ?? 4787);
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5183').split(',').map((s) => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/applications', applicationsRouter);
app.use('/api/stylists', stylistsRouter);
app.use('/api/admin', adminRouter);

app.listen(port, () => {
  console.log(`Her Crown API listening on http://localhost:${port}`);
});
