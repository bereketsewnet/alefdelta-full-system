/**
 * System Scheduler - Runs automated tasks
 * Handles daily penalty processing and other scheduled jobs
 */

import cron from 'node-cron';
import { processOverdueLoanPenalties } from '../loan-repayments/penalty-processor.js';
import { processMonthlyInterest } from '../accounts/interest-processor.js';
import { processInactiveMemberStatuses } from '../members/member-lifecycle-processor.js';
import logger from '../../core/logger.js';

let penaltyJobRunning = false;

/**
 * Daily Penalty Processing Job
 * Runs every day at 1:00 AM
 */
export function startPenaltyProcessingJob() {
  // Run every day at 1:00 AM: '0 1 * * *'
  // For testing, you can use '*/5 * * * *' (every 5 minutes)
  const schedule = process.env.PENALTY_CRON_SCHEDULE || '0 1 * * *';
  
  const job = cron.schedule(schedule, async () => {
    if (penaltyJobRunning) {
      logger.info('Penalty job already running, skipping...');
      return;
    }
    
    try {
      penaltyJobRunning = true;
      logger.info('Starting automated penalty processing...');
      console.log('\n🤖 === AUTOMATIC PENALTY PROCESSING ===');
      console.log(`Time: ${new Date().toISOString()}\n`);
      
      const result = await processOverdueLoanPenalties();
      
      logger.info('Penalty processing completed', result);
      console.log('\n✅ Penalty processing completed successfully\n');
      
    } catch (error) {
      logger.error('Penalty processing failed', { error: error.message, stack: error.stack });
      console.error('\n❌ Penalty processing failed:', error.message);
    } finally {
      penaltyJobRunning = false;
    }
  }, {
    scheduled: true,
    timezone: 'Africa/Addis_Ababa' // Ethiopia timezone
  });
  
  console.log(`✅ Penalty processing job scheduled: ${schedule}`);
  console.log(`   Timezone: Africa/Addis_Ababa\n`);
  
  return job;
}

/**
 * Monthly Interest Posting Job
 * Runs on the 1st of each month at 2:00 AM
 */
export function startInterestPostingJob() {
  // Run on 1st of every month at 2:00 AM: '0 2 1 * *'
  // For testing: '*/10 * * * *' (every 10 minutes)
  const schedule = process.env.INTEREST_CRON_SCHEDULE || '0 2 1 * *';
  
  const job = cron.schedule(schedule, async () => {
    try {
      logger.info('Starting automated interest posting...');
      console.log('\n💰 === AUTOMATIC INTEREST POSTING ===');
      console.log(`Time: ${new Date().toISOString()}\n`);
      
      const result = await processMonthlyInterest();
      
      logger.info('Interest posting completed', result);
      console.log('\n✅ Interest posting completed successfully\n');
      
    } catch (error) {
      logger.error('Interest posting failed', { error: error.message, stack: error.stack });
      console.error('\n❌ Interest posting failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Africa/Addis_Ababa'
  });
  
  console.log(`✅ Interest posting job scheduled: ${schedule}`);
  console.log(`   Runs on: 1st of each month at 2:00 AM`);
  console.log(`   Timezone: Africa/Addis_Ababa\n`);
  
  return job;
}

/**
 * Member Inactivity Processing Job
 * Runs daily at 3:00 AM to check member inactivity
 */
export function startInactivityProcessingJob() {
  // Run every day at 3:00 AM: '0 3 * * *'
  const schedule = process.env.INACTIVITY_CRON_SCHEDULE || '0 3 * * *';
  
  const job = cron.schedule(schedule, async () => {
    try {
      logger.info('Starting member inactivity status processing...');
      console.log('\n👥 === AUTOMATIC INACTIVITY PROCESSING ===');
      console.log(`Time: ${new Date().toISOString()}\n`);
      
      const result = await processInactiveMemberStatuses();
      
      logger.info('Inactivity processing completed', result);
      console.log('\n✅ Inactivity processing completed successfully\n');
      
    } catch (error) {
      logger.error('Inactivity processing failed', { error: error.message, stack: error.stack });
      console.error('\n❌ Inactivity processing failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Africa/Addis_Ababa'
  });
  
  console.log(`✅ Inactivity processing job scheduled: ${schedule}`);
  console.log(`   Runs: Daily at 3:00 AM`);
  console.log(`   Timezone: Africa/Addis_Ababa\n`);
  
  return job;
}

/**
 * Start all scheduled jobs
 */
export function startAllScheduledJobs() {
  console.log('\n📅 Starting scheduled jobs...');
  
  const penaltyJob = startPenaltyProcessingJob();
  const interestJob = startInterestPostingJob();
  const inactivityJob = startInactivityProcessingJob();
  
  console.log('✅ All scheduled jobs started\n');
  
  return {
    penaltyJob,
    interestJob,
    inactivityJob
  };
}


