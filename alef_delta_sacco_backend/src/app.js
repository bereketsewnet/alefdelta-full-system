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

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(
  cors({
    origin: '*',
    exposedHeaders: ['Idempotency-Key']
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Serve uploads with CORS headers
const uploadsPath = config.uploads.root;
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.resolve(uploadsPath)));

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
app.use('/api', routes);

app.use(errorHandler);

export default app;

