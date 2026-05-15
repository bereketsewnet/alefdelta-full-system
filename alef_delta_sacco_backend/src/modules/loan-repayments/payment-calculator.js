import dayjs from 'dayjs';

/**
 * Calculate total loan amount with FLAT interest
 * @param {number} principal - Original loan amount
 * @param {number} interestRate - Annual interest rate (e.g., 12 for 12%)
 * @param {number} termMonths - Loan term in months
 * @returns {number} - Total amount to repay
 */
export function calculateFlatTotal(principal, interestRate, termMonths) {
  // Ensure all inputs are numbers to prevent string concatenation
  const p = Number(principal);
  const r = Number(interestRate);
  const t = Number(termMonths);
  
  const totalInterest = (p * (r / 100) * (t / 12));
  return Number(p + totalInterest);
}

/**
 * Calculate monthly installment for FLAT interest loan
 * @param {number} principal
 * @param {number} interestRate
 * @param {number} termMonths
 * @returns {number} - Monthly payment amount
 */
export function calculateFlatMonthlyPayment(principal, interestRate, termMonths) {
  const total = calculateFlatTotal(principal, interestRate, termMonths);
  return Number(total / Number(termMonths));
}

/**
 * Calculate monthly installment for DECLINING balance interest
 * @param {number} principal
 * @param {number} annualRate - Annual interest rate
 * @param {number} termMonths
 * @returns {number} - Monthly payment (EMI)
 */
export function calculateDecliningMonthlyPayment(principal, annualRate, termMonths) {
  const p = Number(principal);
  const r = Number(annualRate);
  const t = Number(termMonths);
  const monthlyRate = r / 100 / 12;
  
  if (monthlyRate === 0) return Number(p / t);
  
  const emi = p * monthlyRate * Math.pow(1 + monthlyRate, t) / 
              (Math.pow(1 + monthlyRate, t) - 1);
  return Number(emi);
}

/**
 * Calculate outstanding balance for a loan
 * @param {Object} loan - Loan object
 * @returns {number} - Current outstanding balance
 */
export function calculateOutstandingBalance(loan) {
  const principal = Number(loan.approved_amount ?? loan.applied_amount ?? 0);
  const interestRate = Number(loan.interest_rate ?? 0);
  const termMonths = Number(loan.term_months ?? 1);
  const totalPaid = Number(loan.total_paid ?? 0);
  const totalPenalty = Number(loan.total_penalty ?? 0);
  
  if (loan.interest_type === 'FLAT') {
    const totalAmount = calculateFlatTotal(principal, interestRate, termMonths);
    return Number(totalAmount) + totalPenalty - totalPaid;
  } else {
    // DECLINING: Calculate based on remaining principal
    const principalPaid = totalPaid - totalPenalty;
    const remainingPrincipal = principal - principalPaid;
    return Math.max(0, remainingPrincipal + totalPenalty);
  }
}

/**
 * Calculate expected payment for current month
 * @param {Object} loan
 * @returns {Object} - { principal, interest, total }
 */
export function calculateExpectedPayment(loan) {
  const principal = Number(loan.approved_amount ?? loan.applied_amount ?? 0);
  const interestRate = Number(loan.interest_rate ?? 0);
  const termMonths = Math.max(1, Number(loan.term_months ?? 1));
  const paymentsMade = Number(loan.payments_made ?? 0);
  
  if (loan.interest_type === 'FLAT') {
    const monthlyPayment = calculateFlatMonthlyPayment(principal, interestRate, termMonths);
    const principalPortion = principal / termMonths;
    const interestPortion = monthlyPayment - principalPortion;
    
    return {
      principal: principalPortion,
      interest: interestPortion,
      total: monthlyPayment
    };
  } else {
    // DECLINING: Calculate based on remaining balance
    const emi = calculateDecliningMonthlyPayment(principal, interestRate, termMonths);
    const totalPaidPrincipal = Number(loan.total_paid ?? 0) - Number(loan.total_penalty ?? 0);
    const remainingPrincipal = principal - totalPaidPrincipal;
    const monthlyRate = interestRate / 100 / 12;
    const interestPortion = remainingPrincipal * monthlyRate;
    const principalPortion = emi - interestPortion;
    
    return {
      principal: Math.max(0, principalPortion),
      interest: Math.max(0, interestPortion),
      total: emi
    };
  }
}

/**
 * Calculate penalty for missed payments
 * @param {Object} loan
 * @param {number} penaltyRate - Penalty rate (e.g., 2 for 2% per month)
 * @returns {Object} - { penaltyAmount, missedMonths }
 */
export function calculatePenalty(loan, penaltyRate = 2) {
  if (!loan.next_payment_date || loan.workflow_status !== 'APPROVED') {
    return { penaltyAmount: 0, missedMonths: 0 };
  }
  
  const today = dayjs();
  const nextPayment = dayjs(loan.next_payment_date);
  
  // No penalty if payment is not yet due
  if (today.isBefore(nextPayment)) {
    return { penaltyAmount: 0, missedMonths: 0 };
  }
  
  // Calculate months overdue
  const monthsOverdue = today.diff(nextPayment, 'month');
  
  if (monthsOverdue <= 0) {
    return { penaltyAmount: 0, missedMonths: 0 };
  }
  
  // Calculate expected monthly payment
  const expectedPayment = calculateExpectedPayment(loan);
  
  // Penalty = Expected Monthly Payment × Penalty Rate × Months Overdue
  const penaltyAmount = expectedPayment.total * (penaltyRate / 100) * monthsOverdue;
  
  return {
    penaltyAmount: Math.round(penaltyAmount * 100) / 100,
    missedMonths: monthsOverdue
  };
}

/**
 * Allocate payment across principal, interest, and penalty
 * @param {number} paymentAmount
 * @param {Object} loan
 * @param {number} currentPenalty
 * @returns {Object} - { principal, interest, penalty, remaining }
 */
export function allocatePayment(paymentAmount, loan, currentPenalty = 0) {
  let remaining = Number(paymentAmount) || 0;
  let penaltyPaid = 0;
  let interestPaid = 0;
  let principalPaid = 0;
  
  // Priority 1: Pay penalty first
  if (currentPenalty > 0) {
    penaltyPaid = Math.min(remaining, currentPenalty);
    remaining -= penaltyPaid;
  }
  
  // Priority 2: Pay interest
  if (remaining > 0) {
    const expected = calculateExpectedPayment(loan);
    const expectedInterest = Number(expected?.interest ?? 0);
    interestPaid = Math.min(remaining, Number.isFinite(expectedInterest) ? expectedInterest : 0);
    remaining -= interestPaid;
  }
  
  // Priority 3: Pay principal
  if (remaining > 0) {
    const outstandingBalance = calculateOutstandingBalance(loan);
    const ob = Number(outstandingBalance);
    const maxPrincipal = (Number.isFinite(ob) ? ob : 0) - Number(currentPenalty || 0);
    principalPaid = Math.min(remaining, Math.max(0, maxPrincipal));
    remaining -= principalPaid;
  }
  
  return {
    principalPaid: Math.round(principalPaid * 100) / 100,
    interestPaid: Math.round(interestPaid * 100) / 100,
    penaltyPaid: Math.round(penaltyPaid * 100) / 100,
    remaining: Math.round(remaining * 100) / 100
  };
}

/**
 * Calculate next payment date based on frequency
 * @param {Date|string} currentDate
 * @param {string} frequency - MONTHLY, WEEKLY, QUARTERLY
 * @returns {string} - Next payment date in YYYY-MM-DD format
 */
export function calculateNextPaymentDate(currentDate, frequency) {
  const date = dayjs(currentDate);
  
  switch (frequency) {
    case 'WEEKLY':
      return date.add(1, 'week').format('YYYY-MM-DD');
    case 'QUARTERLY':
      return date.add(3, 'months').format('YYYY-MM-DD');
    case 'MONTHLY':
    default:
      return date.add(1, 'month').format('YYYY-MM-DD');
  }
}


