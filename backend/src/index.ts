import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import studentRoutes from './routes/student.js';
import adminRoutes from './routes/admin.js';
import interactionRoutes from './routes/interactions.js';
import { initDatabase } from './db/index.js';
import { errorHandler, notFound } from './middleware/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.get('/health', (_req, res) => res.json({ ok: true, service: 'campus-reuse', timestamp: new Date().toISOString() }));
app.get('/manus-routes.json', (_req, res) => res.sendFile(path.join(root, 'public/manus-routes.json')));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', interactionRoutes);

if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ root: path.join(root, 'frontend'), server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(root, 'dist/client')));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(root, 'dist/client/index.html'));
  });
}
app.use(notFound);
app.use(errorHandler);

await initDatabase();
app.listen(port, '0.0.0.0', () => console.log(`Campus Reuse listening on http://0.0.0.0:${port}`));
