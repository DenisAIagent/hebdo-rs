import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { authMiddleware } from './middleware/auth';
import { adminMiddleware } from './middleware/admin';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/deliveries';
import adminRoutes from './routes/admin';
import correctionRoutes from './routes/correction';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const isProd = process.env.NODE_ENV === 'production';

// Security
app.use(helmet({
  contentSecurityPolicy: isProd ? false : undefined,
}));
app.use(cors({
  origin: isProd
    ? (process.env.FRONTEND_URL || true)
    : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', authMiddleware, deliveryRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
app.use('/api/correct', authMiddleware, correctionRoutes);

// ── Serve frontend in production ─────────────────────────────
if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  // SPA fallback: all non-API routes serve index.html (Express 5 syntax)
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`RS Hebdo Delivery API running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});

export default app;
