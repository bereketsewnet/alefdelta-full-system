import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const rootDir = path.resolve(process.cwd());

const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: process.env.PORT || 4000,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alef_delta_sacco',
    connectionLimit: 10,
    waitForConnections: true,
    dateStrings: true
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },
  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12)
  },
  uploads: {
    root: path.resolve(rootDir, process.env.UPLOADS_PATH || './uploads'),
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', // Some browsers send this instead of image/jpeg
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ]
  },
  otp: {
    expirationMinutes: Number(process.env.OTP_EXP_MIN || 10)
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 20)
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  bot: {
    token: process.env.BOT_TOKEN,
    webhookUrl: process.env.BOT_WEBHOOK_URL
  }
};

export default config;

