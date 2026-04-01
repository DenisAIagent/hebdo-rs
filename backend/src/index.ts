import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { authMiddleware } from './middleware/auth';
import { adminMiddleware } from './middleware/admin';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/deliveries';
import adminRoutes from './routes/admin';
import correctionRoutes from './routes/correction';
import setupRoutes from './routes/setup';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const isProd = process.env.NODE_ENV === 'production';

// Trust Railway reverse proxy (required for rate-limit + real IP detection)
if (isProd) {
  app.set('trust proxy', 1);
}

// Security
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://client.crisp.chat"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://client.crisp.chat"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://client.crisp.chat"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://client.relay.crisp.chat", "https://client.crisp.chat", "https://storage.crisp.chat"],
      frameSrc: ["https://game.crisp.chat"],
      objectSrc: ["'none'"],
    },
  } : undefined,
}));
const allowedOrigins = isProd
  ? [process.env.FRONTEND_URL].filter(Boolean) as string[]
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', authMiddleware, deliveryRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
app.use('/api/correct', authMiddleware, correctionRoutes);

// ── Serve frontend in production ─────────────────────────────
if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist, {
    maxAge: '1d',
    immutable: true,
  }));
  // SPA fallback: only for non-API, non-asset routes
  app.get('/{*splat}', (req, res) => {
    // Don't serve index.html for asset requests (js, css, images, etc.)
    if (req.path.startsWith('/assets/') || req.path.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff2?|ttf|eot)$/)) {
      return res.status(404).send('Not found');
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorId = crypto.randomUUID();
  console.error(`Server error [${errorId}]:`, isProd ? err.message : err);
  res.status(500).json({ error: 'Internal server error', reference: errorId });
});

const server = app.listen(PORT, () => {
  console.log(`RS Hebdo Delivery API running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});

// Allow long uploads + Dropbox transfers (5 min timeout)
server.timeout = 300_000;
server.keepAliveTimeout = 300_000;
server.headersTimeout = 310_000;

export default app;
