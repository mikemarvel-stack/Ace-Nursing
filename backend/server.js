require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const requestId = require('express-request-id')();

const { loadSecrets } = require('./utils/secrets');
const { initTelemetry, shutdownTelemetry } = require('./utils/telemetry');
const { logger, childLogger } = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const sitemapRoutes = require('./routes/sitemap');

const app = express();
app.disable('x-powered-by');

// Trust proxy headers when deployed behind a load balancer / reverse proxy
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Enforce HTTPS when requested (useful behind proxies/load balancers)
if (process.env.ENFORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
    if (isSecure) return next();
    return res.redirect(`https://${req.get('host')}${req.originalUrl}`);
  });
}

// ─── Load secrets early (AWS Secrets Manager) ──────────────────────────────────
async function loadConfig() {
  try {
    await loadSecrets();
  } catch (err) {
    logger.error('Failed to load secrets: %s', err.message);
    throw err;
  }
}

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.paypal.com', 'https://www.paypalobjects.com'],
      frameSrc: ["'self'", 'https://www.paypal.com', 'https://www.sandbox.paypal.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://api.paypal.com', 'https://api.sandbox.paypal.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));
app.use(mongoSanitize());
// ─── Request Tracing / Logging ─────────────────────────────────────────────────
app.use(requestId);
app.use((req, res, next) => {
  res.setHeader('X-Request-Id', req.id);
  next();
});
app.use(requestLogger);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOrigins = [process.env.FRONTEND_URL].filter(Boolean);
if (process.env.NODE_ENV !== 'production') {
  corsOrigins.push('http://localhost:3000', 'http://localhost:5173');
}

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many upload requests, please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/upload', uploadLimiter);

// ─── CSRF mitigation ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const mutating = ['POST', 'PUT', 'PATCH'];
  if (!mutating.includes(req.method)) return next();
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json') && !ct.includes('multipart/form-data')) {
    return res.status(415).json({ error: 'Unsupported Media Type' });
  }
  next();
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// HTTP access logging — dev uses coloured output, production streams through Winston
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/api/health',
  }));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/', sitemapRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    requestId: req.id,
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const log = childLogger(req);
  log.error('Unhandled error: %s', err.message, { stack: err.stack });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} already exists` });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired, please log in again' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Database + Server Boot ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const REQUIRED_ENV = [
  'MONGODB_URI', 'JWT_SECRET',
  'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE',
  'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET',
  'RESEND_API_KEY', 'FROM_EMAIL', 'FRONTEND_URL',
];

async function startServer() {
  await loadConfig();

  const missing = REQUIRED_ENV.filter(k => !process.env[k]);
  if (missing.length) {
    logger.error('Missing required environment variables: %s', missing.join(', '));
    process.exit(1);
  }

  // Initialize tracing (if enabled) before other work
  initTelemetry();

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 20,
    });
    logger.info('MongoDB connected');

    app.listen(PORT, () => {
      logger.info('AceNursing API running on port %s [%s]', PORT, process.env.NODE_ENV);
    });
  } catch (err) {
    logger.error('MongoDB connection failed: %s', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer().catch(err => {
    logger.error('Failed to start server: %s', err.message);
    process.exit(1);
  });
}

// ─── Graceful shutdown + global error handling ─────────────────────────────────
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection at: %o reason: %o', promise, reason);
  await shutdownTelemetry();
});

process.on('uncaughtException', async (err) => {
  logger.error('Uncaught Exception: %s', err.stack || err.message);
  await shutdownTelemetry();
  process.exit(1);
});

module.exports = { app, startServer };
