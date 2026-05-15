import http from 'node:http';
import app from './app.js';
import config from './core/config.js';
import logger from './core/logger.js';
import { healthCheck } from './core/db.js';
import { startAllScheduledJobs } from './modules/system/scheduler.js';

async function start() {
  await healthCheck();
  const server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`ALEF-DELTA SACCO API listening on port ${config.port}`);
    
    // Start scheduled jobs (automatic penalty processing, etc.)
    startAllScheduledJobs();
  });
}

start().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

