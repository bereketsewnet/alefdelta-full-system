/**
 * Savings Account Interest Processor
 * Calculates and applies monthly interest based on banking rules
 */

import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { query, execute, withTransaction } from '../../core/db.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import logger from '../../core/logger.js';

/**
 * Calculate monthly interest for an account
 * 
 * Banking Rule:
 * - If deposits made during month: Use OPENING balance (balance at month start)
 * - If withdrawals made during month: Use MINIMUM balance (lowest balance during month)
 * 
 * @param {Object} account - Account object
 * @param {number} interestRate - Annual interest rate
 * @param {number} daysInMonth - Days in the month (default 30)
 * @returns {Object} - { interest_amount, balance_used, method }
 */
export function calculateMonthlyInterest(account, interestRate, daysInMonth = 30) {
  const openingBalance = Number(account.month_opening_balance || account.balance);
  const minimumBalance = Number(account.month_minimum_balance || account.balance);
  const currentBalance = Number(account.balance);
  
  // Determine which balance to use
  let balanceForInterest;
  let method;
  
  // If minimum balance is less than opening balance, withdrawals occurred
  // Use minimum balance (withdrawal rule)
  if (minimumBalance < openingBalance) {
    balanceForInterest = minimumBalance;
    method = 'MINIMUM_BALANCE';
  } else {
    // No withdrawals or deposits only - use opening balance (deposit rule)
    balanceForInterest = openingBalance;
    method = 'OPENING_BALANCE';
  }
  
  // Calculate interest: Balance × (Annual Rate / 12) for monthly
  // Or: Balance × (Annual Rate / 365) × Days for exact calculation
  const monthlyRate = Number(interestRate) / 100 / 12;
  const interestAmount = Number(balanceForInterest) * monthlyRate;
  
  return {
    interest_amount: Math.round(interestAmount * 100) / 100,
    balance_used: balanceForInterest,
    method,
    rate_used: interestRate
  };
}

/**
 * Process monthly interest for all eligible accounts
 * Should be run on the 1st of each month
 */
export async function processMonthlyInterest() {
  console.log('💰 Processing Monthly Interest for Savings Accounts...\n');
  
  const today = dayjs();
  const lastMonth = today.subtract(1, 'month').format('YYYY-MM');
  const firstOfMonth = today.startOf('month');
  
  // Get all active accounts with interest-bearing products
  const accounts = await query(`
    SELECT 
      a.*,
      ap.interest_rate,
      ap.name as product_name,
      m.first_name,
      m.last_name,
      m.phone_primary
    FROM accounts a
    JOIN account_products ap ON a.product_code = ap.product_code
    JOIN members m ON a.member_id = m.member_id
    WHERE a.status = 'ACTIVE'
    AND ap.interest_rate > 0
    AND (a.last_interest_date IS NULL OR a.last_interest_date < ?)
  `, [firstOfMonth.format('YYYY-MM-DD')]);
  
  console.log(`Found ${accounts.length} account(s) eligible for interest\n`);
  
  let processedCount = 0;
  let totalInterestPosted = 0;
  let skippedCount = 0;
  
  for (const account of accounts) {
    try {
      // Skip if balance is zero or negative
      if (Number(account.balance) <= 0) {
        console.log(`⏭️  Account ${account.account_id}: Zero balance, skipping`);
        skippedCount++;
        continue;
      }
      
      // Calculate interest
      const interestCalc = calculateMonthlyInterest(account, account.interest_rate);
      
      // Skip if interest is negligible (< 0.01)
      if (interestCalc.interest_amount < 0.01) {
        console.log(`⏭️  Account ${account.account_id}: Interest too small (${interestCalc.interest_amount}), skipping`);
        skippedCount++;
        continue;
      }
      
      // Process in transaction
      await withTransaction(async (connection) => {
        const postingId = uuid();
        const newBalance = Number(account.balance) + Number(interestCalc.interest_amount);
        
        // Insert interest posting record
        await connection.execute(`
          INSERT INTO interest_postings 
          (posting_id, account_id, member_id, posting_date, interest_amount, 
           calculation_method, balance_used, interest_rate, days_in_month,
           balance_before, balance_after, posting_month)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          postingId,
          account.account_id,
          account.member_id,
          today.format('YYYY-MM-DD'),
          interestCalc.interest_amount,
          interestCalc.method,
          interestCalc.balance_used,
          account.interest_rate,
          today.daysInMonth(),
          account.balance,
          newBalance,
          lastMonth
        ]);
        
        // Update account balance and tracking fields
        await connection.execute(`
          UPDATE accounts 
          SET 
            balance = ?,
            interest_earned_ytd = interest_earned_ytd + ?,
            last_interest_date = ?,
            month_opening_balance = ?,
            month_minimum_balance = ?,
            version = version + 1,
            updated_at = NOW()
          WHERE account_id = ?
        `, [
          newBalance,
          interestCalc.interest_amount,
          today.format('YYYY-MM-DD'),
          newBalance, // New month starts with current balance
          newBalance, // Reset minimum to current balance
          account.account_id
        ]);
        
        // Create transaction record (for member's transaction history)
        await connection.execute(`
          INSERT INTO transactions 
          (txn_id, account_id, txn_type, amount, balance_after, reference, performed_by, created_at)
          VALUES (?, ?, 'DEPOSIT', ?, ?, ?, NULL, NOW())
        `, [
          uuid(),
          account.account_id,
          interestCalc.interest_amount,
          newBalance,
          `Interest ${lastMonth} (${interestCalc.method})`
        ]);
        
        // Audit log
        await insertAuditLog({
          userId: null, // System action
          action: 'POST_INTEREST',
          entity: 'accounts',
          entityId: account.account_id,
          metadata: {
            interest_amount: interestCalc.interest_amount,
            method: interestCalc.method,
            balance_used: interestCalc.balance_used,
            rate: account.interest_rate,
            month: lastMonth
          }
        });
      });
      
      console.log(`✅ Account ${account.account_id} (${account.first_name} ${account.last_name}): ETB ${interestCalc.interest_amount.toFixed(2)} interest posted (${interestCalc.method})`);
      processedCount++;
      totalInterestPosted += interestCalc.interest_amount;
      
    } catch (error) {
      console.error(`❌ Error processing account ${account.account_id}:`, error.message);
      logger.error('Interest processing error', { account_id: account.account_id, error: error.message });
    }
  }
  
  console.log(`\n📊 Interest Processing Summary:`);
  console.log(`   Total Accounts Checked: ${accounts.length}`);
  console.log(`   Interest Posted: ${processedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total Interest Amount: ETB ${totalInterestPosted.toFixed(2)}`);
  
  return {
    total_accounts: accounts.length,
    processed: processedCount,
    skipped: skippedCount,
    total_interest: totalInterestPosted
  };
}

/**
 * Update month opening/minimum balance tracking on transactions
 * Call this after every deposit/withdrawal
 * 
 * @param {string} accountId
 * @param {number} newBalance
 * @param {string} txnType - 'DEPOSIT' or 'WITHDRAWAL'
 */
export async function updateMonthlyBalanceTracking(accountId, newBalance, txnType) {
  const today = dayjs();
  const firstOfMonth = today.startOf('month');
  
  // Retry logic for lock timeout (max 3 retries with exponential backoff)
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Get current account state
      const accounts = await query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);
      const account = accounts[0];
      
      if (!account) return;
      
      const currentBalance = Number(newBalance);
      const monthOpening = account.month_opening_balance;
      const monthMinimum = account.month_minimum_balance;
      
      // If last interest date is before this month, reset tracking
      const lastInterestDate = account.last_interest_date ? dayjs(account.last_interest_date) : null;
      const needsReset = !lastInterestDate || lastInterestDate.isBefore(firstOfMonth);
      
      let newOpening = monthOpening;
      let newMinimum = monthMinimum;
      
      if (needsReset) {
        // First transaction of the month - set both to current balance
        newOpening = currentBalance;
        newMinimum = currentBalance;
      } else {
        // Mid-month transaction
        newOpening = monthOpening !== null ? monthOpening : currentBalance;
        
        // Update minimum if this balance is lower
        if (monthMinimum === null || currentBalance < monthMinimum) {
          newMinimum = currentBalance;
        } else {
          newMinimum = monthMinimum;
        }
      }
      
      // Update tracking fields - this may timeout if another transaction is updating the same account
      await execute(`
        UPDATE accounts 
        SET 
          month_opening_balance = ?,
          month_minimum_balance = ?
        WHERE account_id = ?
      `, [newOpening, newMinimum, accountId]);
      
      // Success - exit retry loop
      return;
    } catch (error) {
      retryCount++;
      
      // If it's a lock timeout and we have retries left, wait and retry
      if ((error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.errno === 1205) && retryCount < maxRetries) {
        const waitTime = Math.min(100 * Math.pow(2, retryCount - 1), 500); // Exponential backoff: 100ms, 200ms, 400ms (max 500ms)
        logger.warn(`Lock timeout on account ${accountId}, retrying (${retryCount}/${maxRetries}) after ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a lock timeout or we're out of retries, log warning but don't fail the deposit
      // This is a non-critical update that can be retried later
      logger.error('Error updating monthly balance tracking (non-critical)', { 
        accountId, 
        error: error.message,
        errorCode: error.code,
        retryCount 
      });
      
      // Don't throw - allow deposit to succeed even if tracking update fails
      // The tracking can be recalculated during interest posting
      return;
    }
  }
}

/**
 * Get interest posting history for an account
 */
export async function getInterestHistory(accountId, limit = 12) {
  return query(`
    SELECT * FROM interest_postings 
    WHERE account_id = ? 
    ORDER BY posting_date DESC 
    LIMIT ?
  `, [accountId, limit]);
}


