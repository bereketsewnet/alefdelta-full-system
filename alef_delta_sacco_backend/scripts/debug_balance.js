import { query } from '../src/core/db.js';
import { calculateOutstandingBalance } from '../src/modules/loan-repayments/payment-calculator.js';

const loans = await query('SELECT * FROM loan_applications WHERE loan_id = ?', ['131534f7-9d68-4af6-b2cb-f1ae6d172204']);
const loan = loans[0];

console.log('Loan data from DB:');
console.log('  approved_amount:', loan.approved_amount, typeof loan.approved_amount);
console.log('  total_paid:', loan.total_paid, typeof loan.total_paid);
console.log('  total_penalty:', loan.total_penalty, typeof loan.total_penalty);
console.log('  interest_type:', loan.interest_type);
console.log('  interest_rate:', loan.interest_rate);
console.log('  term_months:', loan.term_months);
console.log('');

const result = calculateOutstandingBalance(loan);
console.log('Calculated Outstanding:', result);

// Manual calculation
const principal = loan.approved_amount || loan.applied_amount;
const totalPaid = loan.total_paid || 0;
const totalPenalty = loan.total_penalty || 0;
const principalPaid = totalPaid - totalPenalty;
const remainingPrincipal = principal - principalPaid;

console.log('');
console.log('Manual calculation:');
console.log('  principal:', principal);
console.log('  principalPaid:', principalPaid);
console.log('  remainingPrincipal:', remainingPrincipal);
console.log('  + totalPenalty:', totalPenalty);
console.log('  = result:', remainingPrincipal + totalPenalty);

process.exit(0);

