import winston from 'winston';
import config from './config.js';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    return Object.assign({}, info, {
      message: info.message,
      stack: info.stack
    });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.isProd ? 'info' : 'debug',
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export default logger;

