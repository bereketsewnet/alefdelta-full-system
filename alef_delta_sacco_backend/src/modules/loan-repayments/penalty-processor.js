/**
 * Automatic Penalty Processing System
 * Runs daily to check for overdue loans and apply penalties
 */

import dayjs from 'dayjs';
import { query, execute, withTransaction } from '../../core/db.js';
import { calculatePenalty, calculateNextPaymentDate } from './payment-calculator.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import logger from '../../core/logger.js';

/**
 * Check all approved loans and apply penalties for overdue payments
 * This should be run daily via cron job
 */
export async function processOverdueLoanPenalties() {
  console.log('🔍 Checking for overdue loans...\n');
  
  const today = dayjs();
  
  // Find all approved loans that have a next_payment_date in the past
  const overdueLoans = await query(`
    SELECT * FROM loan_applications 
    WHERE workflow_status = 'APPROVED' 
    AND is_fully_paid = 0
    AND next_payment_date IS NOT NULL 
    AND next_payment_date < ?
  `, [today.format('YYYY-MM-DD')]);
  
  console.log(`Found ${overdueLoans.length} overdue loan(s)\n`);
  
  let processedCount = 0;
  let penaltyTotal = 0;
  
  for (const loan of overdueLoans) {
    try {
      // Calculate how many payment periods have been missed
      const nextPayment = dayjs(loan.next_payment_date);
      const daysOverdue = today.diff(nextPayment, 'day');
      
      // Determine payment frequency interval in days
      let intervalDays;
      switch (loan.repayment_frequency) {
        case 'WEEKLY':
          intervalDays = 7;
          break;
        case 'QUARTERLY':
          intervalDays = 90; // approximately 3 months
          break;
        case 'MONTHLY':
        default:
          intervalDays = 30;
          break;
      }
      
      // Calculate how many payment periods were missed
      const periodsMissed = Math.floor(daysOverdue / intervalDays);
      
      if (periodsMissed === 0) {
        console.log(`⏭️  Loan ${loan.loan_id}: Overdue but less than one period, skipping`);
        continue;
      }
      
      // Check if penalty was already applied for this period
      const lastPenaltyCheck = dayjs(loan.last_penalty_date || loan.disbursement_date);
      const daysSinceLastCheck = today.diff(lastPenaltyCheck, 'day');
      
      if (daysSinceLastCheck < intervalDays) {
        console.log(`⏭️  Loan ${loan.loan_id}: Penalty already applied recently, skipping`);
        continue;
      }
      
      // Calculate penalty
      const penaltyInfo = calculatePenalty(loan, loan.penalty_rate || 2);
      
      if (penaltyInfo.penaltyAmount === 0) {
        console.log(`⏭️  Loan ${loan.loan_id}: No penalty calculated, skipping`);
        continue;
      }
      
      // Apply penalty in transaction
      await withTransaction(async (connection) => {
        // Update loan with new penalty
        const newTotalPenalty = Number(loan.total_penalty || 0) + Number(penaltyInfo.penaltyAmount);
        const newOutstanding = Number(loan.outstanding_balance) + Number(penaltyInfo.penaltyAmount);
        
        await connection.execute(`
          UPDATE loan_applications 
          SET 
            total_penalty = ?,
            outstanding_balance = ?,
            last_penalty_date = ?
          WHERE loan_id = ?
        `, [
          newTotalPenalty,
          newOutstanding,
          today.format('YYYY-MM-DD'),
          loan.loan_id
        ]);
        
        // Create audit log for penalty application
        await insertAuditLog({
          userId: null, // System action
          action: 'APPLY_LOAN_PENALTY',
          entity: 'loan_applications',
          entityId: loan.loan_id,
          metadata: {
            penalty_amount: penaltyInfo.penaltyAmount,
            missed_periods: penaltyInfo.missedMonths,
            days_overdue: daysOverdue,
            new_total_penalty: newTotalPenalty,
            new_outstanding: newOutstanding,
            penalty_rate: loan.penalty_rate || 2
          }
        });
      });
      
      console.log(`✅ Loan ${loan.loan_id}: Applied penalty ETB ${penaltyInfo.penaltyAmount.toFixed(2)} (${periodsMissed} period(s) missed)`);
      processedCount++;
      penaltyTotal += penaltyInfo.penaltyAmount;
      
    } catch (error) {
      console.error(`❌ Error processing loan ${loan.loan_id}:`, error.message);
      logger.error('Penalty processing error', { loan_id: loan.loan_id, error: error.message });
    }
  }
  
  console.log(`\n📊 Penalty Processing Summary:`);
  console.log(`   Total Overdue Loans: ${overdueLoans.length}`);
  console.log(`   Penalties Applied: ${processedCount}`);
  console.log(`   Total Penalty Amount: ETB ${penaltyTotal.toFixed(2)}`);
  
  return {
    total_overdue: overdueLoans.length,
    penalties_applied: processedCount,
    total_penalty_amount: penaltyTotal
  };
}

/**
 * Get list of overdue loans for reporting
 */
export async function getOverdueLoansReport() {
  const today = dayjs().format('YYYY-MM-DD');
  
  const overdueLoans = await query(`
    SELECT 
      la.*,
      m.first_name,
      m.last_name,
      m.phone_primary,
      m.membership_no,
      DATEDIFF(?, la.next_payment_date) as days_overdue
    FROM loan_applications la
    JOIN members m ON la.member_id = m.member_id
    WHERE la.workflow_status = 'APPROVED' 
    AND la.is_fully_paid = 0
    AND la.next_payment_date IS NOT NULL 
    AND la.next_payment_date < ?
    ORDER BY la.next_payment_date ASC
  `, [today, today]);
  
  return overdueLoans;
}


