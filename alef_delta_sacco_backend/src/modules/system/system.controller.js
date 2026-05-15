import * as systemService from './system.service.js';
import * as reportService from '../reports/report.service.js';
import { processOverdueLoanPenalties, getOverdueLoansReport } from '../loan-repayments/penalty-processor.js';
import { processMonthlyInterest } from '../accounts/interest-processor.js';
import { processInactiveMemberStatuses } from '../members/member-lifecycle-processor.js';

export async function getLastEodStatus(req, res, next) {
  try {
    const status = await systemService.getLastJobStatus('EOD');
    res.json(status || { status: 'NEVER_RUN' });
  } catch (error) {
    next(error);
  }
}

export async function runEndOfDay(req, res, next) {
  try {
    const userId = req.user.userId;
    const jobId = await systemService.startJob('EOD', userId);
    
    // Run async to not block response, or await if client waits
    // For now, we await to verify completion in this demo
    await systemService.processEndOfDay(jobId);
    
    res.json({ message: 'EOD process completed successfully', jobId });
  } catch (error) {
    next(error);
  }
}

export async function getEodPreview(req, res, next) {
  try {
    const { type } = req.query;
    let stats;

    if (type === 'monthly') {
      stats = await systemService.getMonthlyEodStats();
    } else {
      // Default to daily
      stats = await systemService.getDailyEodStats();
    }
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function processPenalties(req, res, next) {
  try {
    const result = await processOverdueLoanPenalties();
    res.json({
      success: true,
      message: 'Penalty processing completed',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function getOverdueLoans(req, res, next) {
  try {
    const overdueLoans = await getOverdueLoansReport();
    res.json({ data: overdueLoans });
  } catch (error) {
    next(error);
  }
}

export async function processInterest(req, res, next) {
  try {
    const result = await processMonthlyInterest();
    res.json({
      success: true,
      message: 'Monthly interest processing completed',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function processInactivity(req, res, next) {
  try {
    const result = await processInactiveMemberStatuses();
    res.json({
      success: true,
      message: 'Member inactivity processing completed',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemConfig(req, res, next) {
  try {
    const config = await systemService.getAllSystemConfig();
    res.json({ data: config });
  } catch (error) {
    next(error);
  }
}

export async function updateSystemConfig(req, res, next) {
  try {
    const { key } = req.params; // Route parameter is :key
    const { config_value } = req.body;
    
    if (!key) {
      throw new Error('config key is required');
    }
    
    if (config_value === undefined || config_value === null) {
      throw new Error('config_value is required');
    }
    
    const result = await systemService.updateSystemConfig(key, config_value, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
