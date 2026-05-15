import logger from '../../core/logger.js';

export default function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error('Unhandled error', { 
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      err: err.toString()
    });
  }
  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(err.code ? { code: err.code } : {}),
    ...(err.details ? { details: err.details } : {})
  });
}

