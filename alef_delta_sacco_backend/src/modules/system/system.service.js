import { query } from '../../core/db.js';
import { v4 as uuidv4 } from 'uuid';
import { getInsuranceMatrix, updateInsuranceRate } from '../loans/insurance.js';

export { getInsuranceMatrix, updateInsuranceRate };

export async function getLastJobStatus(jobType) {
  const [row] = await query(
    'SELECT * FROM system_jobs WHERE job_type = ? ORDER BY started_at DESC LIMIT 1',
    [jobType]
  );
  return row;
}

export async function startJob(jobType, performedBy) {
  const jobId = uuidv4();
  await query(
    'INSERT INTO system_jobs (job_id, job_type, status, performed_by) VALUES (?, ?, ?, ?)',
    [jobId, jobType, 'RUNNING', performedBy]
  );
  return jobId;
}

export async function completeJob(jobId, summary = {}) {
  await query(
    'UPDATE system_jobs SET status = "COMPLETED", completed_at = NOW(), summary = ? WHERE job_id = ?',
    [JSON.stringify(summary), jobId]
  );
}

export async function failJob(jobId, errorMessage) {
  await query(
    'UPDATE system_jobs SET status = "FAILED", completed_at = NOW(), error_message = ? WHERE job_id = ?',
    [errorMessage, jobId]
  );
}

export async function processEndOfDay(jobId) {
  try {
    // EOD records a real reconciliation snapshot only. Interest, penalties and
    // lifecycle changes are handled by their dedicated, idempotent processors.
    const [accounts] = await query('SELECT COUNT(*) as count FROM accounts WHERE status = "ACTIVE"');
    const [transactions] = await query(
      'SELECT COUNT(*) as count FROM transactions WHERE DATE(created_at) = CURDATE()'
    );
    const stats = await getDailyEodStats();
    await completeJob(jobId, {
      processed_accounts: accounts.count,
      processed_transactions: transactions.count,
      total_deposits: stats.total_deposits,
      total_withdrawals: stats.total_withdrawals,
      net_change: stats.net_change,
      steps_completed: ['Daily Transaction Reconciliation']
    });
  } catch (error) {
    await failJob(jobId, error.message);
    throw error;
  }
}

export async function getDailyEodStats() {
  const [deposits] = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
     WHERE txn_type = 'DEPOSIT' AND DATE(created_at) = CURDATE()`
  );

  const [withdrawals] = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
     WHERE txn_type = 'WITHDRAWAL' AND DATE(created_at) = CURDATE()`
  );

  const [activeTellers] = await query(
    `SELECT COUNT(DISTINCT performed_by) as count FROM transactions 
     WHERE DATE(created_at) = CURDATE() AND performed_by IS NOT NULL`
  );

  const totalDeposits = Number(deposits.total);
  const totalWithdrawals = Number(withdrawals.total);

  return {
    total_deposits: totalDeposits,
    total_withdrawals: totalWithdrawals,
    net_change: totalDeposits - totalWithdrawals,
    active_tellers: Number(activeTellers.count)
  };
}

export async function getMonthlyEodStats() {
  const [deposits] = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
     WHERE txn_type = 'DEPOSIT' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
  );

  const [withdrawals] = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
     WHERE txn_type = 'WITHDRAWAL' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
  );

  const [activeTellers] = await query(
    `SELECT COUNT(DISTINCT performed_by) as count FROM transactions 
     WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') AND performed_by IS NOT NULL`
  );

  const totalDeposits = Number(deposits.total);
  const totalWithdrawals = Number(withdrawals.total);

  return {
    total_deposits: totalDeposits,
    total_withdrawals: totalWithdrawals,
    net_change: totalDeposits - totalWithdrawals,
    active_tellers: Number(activeTellers.count)
  };
}

/**
 * Get all system configuration
 */
export async function getAllSystemConfig() {
  return query('SELECT * FROM system_config ORDER BY config_key');
}

/**
 * Update system configuration value
 */
export async function updateSystemConfig(configKey, configValue, updatedBy) {
  // Ensure all parameters are defined
  if (!configKey || configValue === undefined || configValue === null) {
    throw new Error('configKey and configValue are required');
  }
  
  await query(
    'UPDATE system_config SET config_value = ?, updated_by = ?, updated_at = NOW() WHERE config_key = ?',
    [String(configValue), updatedBy || null, configKey]
  );
  
  const [updated] = await query('SELECT * FROM system_config WHERE config_key = ?', [configKey]);
  return updated;
}
