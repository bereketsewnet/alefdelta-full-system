/**
 * Script to fix outstanding balances for all approved loans
 * Run: docker-compose exec api node scripts/fix_loan_balances.js
 */

import { query, execute } from '../src/core/db.js';
import { calculateFlatTotal } from '../src/modules/loan-repayments/payment-calculator.js';

async function fixLoanBalances() {
  console.log('🔧 Fixing loan outstanding balances...\n');
  
  const loans = await query(
    'SELECT * FROM loan_applications WHERE workflow_status = ? AND outstanding_balance IS NOT NULL',
    ['APPROVED']
  );
  
  console.log(`Found ${loans.length} approved loans to check\n`);
  
  for (const loan of loans) {
    const principal = loan.approved_amount || loan.applied_amount;
    const totalPaid = loan.total_paid || 0;
    const totalPenalty = loan.total_penalty || 0;
    
    let correctBalance;
    
    if (loan.interest_type === 'FLAT') {
      // FLAT: Total loan with interest minus what's paid
      const totalAmount = calculateFlatTotal(principal, loan.interest_rate, loan.term_months);
      correctBalance = totalAmount + totalPenalty - totalPaid;
    } else {
      // DECLINING: Remaining principal plus penalties
      const principalPaid = totalPaid - totalPenalty;
      const remainingPrincipal = principal - principalPaid;
      correctBalance = Math.max(0, remainingPrincipal + totalPenalty);
    }
    
    const currentBalance = loan.outstanding_balance;
    
    if (Math.abs(currentBalance - correctBalance) > 0.01) {
      console.log(`❌ Loan ${loan.loan_id}:`);
      console.log(`   Type: ${loan.interest_type}`);
      console.log(`   Principal: ${principal}`);
      console.log(`   Current Balance: ${currentBalance}`);
      console.log(`   Correct Balance: ${correctBalance}`);
      console.log(`   Fixing...\n`);
      
      await execute(
        'UPDATE loan_applications SET outstanding_balance = ? WHERE loan_id = ?',
        [correctBalance, loan.loan_id]
      );
    } else {
      console.log(`✅ Loan ${loan.loan_id}: Balance correct (${correctBalance})`);
    }
  }
  
  console.log('\n✅ All loan balances fixed!');
  process.exit(0);
}

fixLoanBalances().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});


