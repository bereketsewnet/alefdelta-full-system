import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import routes from './api/routes.js';
import config from './core/config.js';
import errorHandler from './core/middleware/errorHandler.js';
import { setupSwagger } from './core/swagger.js';
import httpError from './core/utils/httpError.js';

const app = express();
app.disable('x-powered-by');

// Production traffic reaches the API through the VPS-wide Caddy container.
// Trust exactly that single proxy hop so rate limiting uses the real client IP.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.cors.origins.includes(origin)) return callback(null, true);
      return callback(httpError(403, 'Origin is not allowed'));
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
    exposedHeaders: ['Idempotency-Key'],
    maxAge: 86400
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Serve uploads with CORS headers
const uploadsPath = config.uploads.root;
app.use('/uploads', (req, res, next) => {
  res.header('Cache-Control', 'private, no-store');
  res.header('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.resolve(uploadsPath), { dotfiles: 'deny', index: false, maxAge: 0 }));

// Swagger UI documentation (only in development or if explicitly enabled)
if (!config.isProd || process.env.ENABLE_SWAGGER === 'true') {
  setupSwagger(app);
}

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter);
const apiLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.apiMax, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);
app.use('/api', routes);

app.use(errorHandler);

export default app;
