import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import httpError from '../../core/utils/httpError.js';
import { withTransaction } from '../../core/db.js';
import { findLoanById } from '../loans/loan.repository.js';
import { 
  createRepayment, 
  listRepaymentsByLoan, 
  listRepaymentsByMember,
  findRepaymentById,
  getRepaymentSummary,
  updateRepayment,
  updateLoanBalanceFields 
} from './repayment.repository.js';
import { 
  calculateOutstandingBalance,
  calculateExpectedPayment,
  calculatePenalty,
  allocatePayment,
  calculateNextPaymentDate,
  calculateFlatTotal
} from './payment-calculator.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import { sendPenaltyNotification } from '../../core/utils/sms.js';
import { findMemberById } from '../members/member.repository.js';
import { updateMemberActivity } from '../members/member-lifecycle-processor.js';

/**
 * Process a loan repayment
 * @param {string} loanId
 * @param {Object} payload - { amount, payment_method, bank_receipt_no, company_receipt_no, receipt_no, notes }
 * @param {Object} files - Uploaded receipt photo
 * @param {Object} actor - User making the payment
 * @returns {Object} - Repayment record with calculation details
 */
export async function processLoanRepayment(loanId, payload, files, actor) {
  const loan = await findLoanById(loanId);
  
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  
  if (loan.workflow_status !== 'APPROVED') {
    throw httpError(400, 'Loan must be approved before accepting payments');
  }
  
  if (loan.is_fully_paid) {
    throw httpError(400, 'Loan is already fully paid');
  }
  
  // Check member status - INACTIVE can repay, TERMINATED cannot
  const member = await findMemberById(loan.member_id);
  if (member && member.status === 'TERMINATED') {
    throw httpError(403, 'Member account is TERMINATED. Cannot accept loan payments. Please contact manager for reactivation.');
  }
  
  // Calculate current penalty
  const penaltyInfo = calculatePenalty(loan, loan.penalty_rate || 2);
  
  // Use database outstanding balance as source of truth
  const outstandingBalance = Number(loan.outstanding_balance || loan.approved_amount || loan.applied_amount);
  const totalPenalty = Number(loan.total_penalty || 0) + Number(penaltyInfo.penaltyAmount);
  
  // Validate payment amount
  const paymentAmount = Number(payload.amount);
  if (paymentAmount <= 0) {
    throw httpError(400, 'Payment amount must be greater than zero');
  }

  // Bank receipt is required (either uploaded now, or pre-stored URL e.g. from member repayment request approval)
  const bankReceiptNo = (payload.bank_receipt_no || '').toString().trim();
  const bankReceiptFile = files?.bank_receipt?.[0] || null;
  const bankReceiptPhotoUrlFromPayload = (payload.bank_receipt_photo_url || '').toString().trim() || null;
  if (!bankReceiptNo) {
    throw httpError(400, 'Bank receipt number is required');
  }
  if (!bankReceiptFile && !bankReceiptPhotoUrlFromPayload) {
    throw httpError(400, 'Bank receipt photo is required');
  }
  
  // Allocate payment
  const allocation = allocatePayment(paymentAmount, loan, penaltyInfo.penaltyAmount);
  
  // Calculate new balance
  const balanceAfter = Math.max(0, outstandingBalance - paymentAmount);
  const isFullyPaid = balanceAfter === 0;
  
  // Process in transaction
  return withTransaction(async (connection) => {
    // Create repayment record (ensure all numeric values are properly converted)
    const repaymentId = uuid();
    const repayment = {
      repayment_id: repaymentId,
      loan_id: loanId,
      member_id: loan.member_id,
      payment_date: dayjs().format('YYYY-MM-DD'),
      amount_paid: Number(paymentAmount),
      principal_paid: Number(allocation.principalPaid),
      interest_paid: Number(allocation.interestPaid),
      penalty_paid: Number(allocation.penaltyPaid),
      balance_before: Number(outstandingBalance),
      balance_after: Number(balanceAfter),
      payment_method: payload.payment_method || 'CASH',
      bank_receipt_no: bankReceiptNo,
      bank_receipt_photo_url: bankReceiptFile
        ? toPublicUrl(bankReceiptFile.path)
        : bankReceiptPhotoUrlFromPayload,
      // Company receipt (optional) is stored in existing receipt_no/receipt_photo_url columns
      receipt_no: (payload.company_receipt_no || payload.receipt_no || null),
      receipt_photo_url: (files?.company_receipt?.[0] || files?.receipt?.[0])
        ? toPublicUrl((files?.company_receipt?.[0] || files?.receipt?.[0]).path)
        : ((payload.company_receipt_photo_url || '').toString().trim() || null),
      notes: payload.notes || null,
      performed_by: actor.userId,
      idempotency_key: payload.idempotency_key || null
    };
    
    await createRepayment(repayment, connection);
    
    // Update loan balance fields (ensure all numbers are properly converted)
    const newTotalPaid = Number(loan.total_paid || 0) + Number(payload.amount);
    const newPaymentsMade = Number(loan.payments_made || 0) + 1;
    const newNextPaymentDate = isFullyPaid 
      ? null 
      : calculateNextPaymentDate(dayjs(), loan.repayment_frequency || 'MONTHLY');
    
    await updateLoanBalanceFields(loanId, {
      outstanding_balance: Number(balanceAfter),
      total_paid: Number(newTotalPaid),
      total_penalty: Number(totalPenalty),
      last_payment_date: dayjs().format('YYYY-MM-DD'),
      next_payment_date: newNextPaymentDate,
      payments_made: Number(newPaymentsMade),
      is_fully_paid: isFullyPaid ? 1 : 0
    }, connection);
    
    // Audit log
    await insertAuditLog({
      userId: actor.userId,
      action: 'LOAN_REPAYMENT',
      entity: 'loan_repayments',
      entityId: repaymentId,
      metadata: {
        loan_id: loanId,
        amount: payload.amount,
        balance_after: balanceAfter,
        allocation
      }
    });
    
    // Update member activity (loan payment counts as activity)
    await updateMemberActivity(loan.member_id);
    
    return {
      success: true,
      repayment_id: repaymentId,
      amount_paid: Number(paymentAmount),
      allocation: {
        principal: Number(allocation.principalPaid),
        interest: Number(allocation.interestPaid),
        penalty: Number(allocation.penaltyPaid)
      },
      balance_before: Number(outstandingBalance),
      balance_after: Number(balanceAfter),
      is_fully_paid: isFullyPaid,
      next_payment_date: newNextPaymentDate
    };
  });
}

/**
 * Get loan payment summary with penalties
 * @param {string} loanId
 * @returns {Object} - Complete payment summary
 */
export async function getLoanPaymentSummary(loanId) {
  const loan = await findLoanById(loanId);
  
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  
  const summary = await getRepaymentSummary(loanId);
  const penaltyInfo = calculatePenalty(loan, loan.penalty_rate || 2);
  const expectedPayment = calculateExpectedPayment(loan);
  
  // Use database outstanding_balance as source of truth
  // It's updated on each payment, so no need to recalculate
  const outstandingBalance = loan.outstanding_balance !== null && loan.outstanding_balance !== undefined
    ? Number(loan.outstanding_balance)
    : (loan.approved_amount || loan.applied_amount);
  
  return {
    loan_id: loanId,
    loan_amount: loan.approved_amount || loan.applied_amount,
    interest_type: loan.interest_type,
    interest_rate: loan.interest_rate,
    term_months: loan.term_months,
    outstanding_balance: outstandingBalance,
    total_paid: Number(loan.total_paid || 0), // Use database value
    payments_made: Number(loan.payments_made || 0), // Use database value
    principal_paid: summary.total_principal || 0,
    interest_paid: summary.total_interest || 0,
    penalty_paid: summary.total_penalty || 0,
    current_penalty: penaltyInfo.penaltyAmount,
    missed_months: penaltyInfo.missedMonths,
    expected_payment: expectedPayment,
    next_payment_date: loan.next_payment_date,
    last_payment_date: summary.last_payment_date || null,
    is_fully_paid: loan.is_fully_paid || false,
    is_overdue: penaltyInfo.missedMonths > 0
  };
}

/**
 * Get repayment history for a loan
 */
export async function getLoanRepaymentHistory(loanId) {
  return listRepaymentsByLoan(loanId);
}

/**
 * Update repayment receipt info (staff only)
 */
export async function updateLoanRepaymentReceiptInfo(repaymentId, payload, files, actor) {
  // Only staff roles should reach here (enforced in route)
  const existing = await findRepaymentById(repaymentId);
  if (!existing) {
    throw httpError(404, 'Repayment not found');
  }

  const updates = {};

  if (payload.bank_receipt_no !== undefined) {
    updates.bank_receipt_no = payload.bank_receipt_no ? String(payload.bank_receipt_no).trim() : null;
  }
  if (payload.company_receipt_no !== undefined) {
    updates.receipt_no = payload.company_receipt_no ? String(payload.company_receipt_no).trim() : null;
  }

  const bankReceiptFile = files?.bank_receipt?.[0] || null;
  const companyReceiptFile = files?.company_receipt?.[0] || null;

  if (bankReceiptFile) {
    updates.bank_receipt_photo_url = toPublicUrl(bankReceiptFile.path);
  }
  if (companyReceiptFile) {
    updates.receipt_photo_url = toPublicUrl(companyReceiptFile.path);
  }

  return updateRepayment(repaymentId, updates);
}

/**
 * Get all repayments for a member
 */
export async function getMemberRepayments(memberId) {
  return listRepaymentsByMember(memberId);
}

/**
 * Initialize outstanding balance for approved loan
 * (Call this when loan is approved)
 * @param {string} loanId
 * @param {Object} connection - Optional database connection (for transactions)
 */
export async function initializeLoanBalance(loanId, connection = null) {
  const loan = await findLoanById(loanId, connection);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  
  // Ensure all values are numbers
  const principal = Number(loan.approved_amount || loan.applied_amount);
  const interestRate = Number(loan.interest_rate);
  const termMonths = Number(loan.term_months);
  
  let totalAmount;
  if (loan.interest_type === 'FLAT') {
    totalAmount = Number(calculateFlatTotal(principal, interestRate, termMonths));
  } else {
    totalAmount = Number(principal); // DECLINING: start with principal only
  }
  
  await updateLoanBalanceFields(loanId, {
    outstanding_balance: Number(totalAmount),
    total_paid: 0,
    total_penalty: 0,
    payments_made: 0,
    is_fully_paid: 0
  }, connection);
  
  return { outstanding_balance: Number(totalAmount) };
}

/**
 * Check penalty status and send SMS notification to member
 * Manual trigger for tellers/managers
 * @param {string} loanId
 * @param {Object} actor - User performing the check
 * @returns {Object} - Penalty status and SMS result
 */
export async function checkPenaltyAndNotify(loanId, actor) {
  const loan = await findLoanById(loanId);
  
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  
  if (loan.workflow_status !== 'APPROVED') {
    throw httpError(400, 'Loan must be approved to check penalties');
  }
  
  // Get member info
  const member = await findMemberById(loan.member_id);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  // Calculate current penalty
  const penaltyInfo = calculatePenalty(loan, loan.penalty_rate || 2);
  const outstandingBalance = Number(loan.outstanding_balance);
  
  // Send SMS notification
  const smsResult = await sendPenaltyNotification(member, loan, penaltyInfo);
  
  // Log the manual check
  await insertAuditLog({
    userId: actor.userId,
    action: 'CHECK_LOAN_PENALTY',
    entity: 'loan_applications',
    entityId: loanId,
    metadata: {
      penalty_amount: penaltyInfo.penaltyAmount,
      missed_months: penaltyInfo.missedMonths,
      outstanding_balance: outstandingBalance,
      sms_sent: smsResult.success,
      checked_by: actor.username
    }
  });
  
  return {
    success: true,
    loan_id: loanId,
    member_name: `${member.first_name} ${member.last_name}`,
    member_phone: member.phone_primary,
    has_penalty: penaltyInfo.penaltyAmount > 0,
    penalty_amount: penaltyInfo.penaltyAmount,
    missed_months: penaltyInfo.missedMonths,
    outstanding_balance: outstandingBalance,
    next_payment_date: loan.next_payment_date,
    sms_sent: smsResult.success,
    sms_message_id: smsResult.messageId,
    message: penaltyInfo.penaltyAmount > 0
      ? `Member has ${penaltyInfo.missedMonths} missed payment(s) with ETB ${penaltyInfo.penaltyAmount.toFixed(2)} penalty`
      : 'No penalties - Payment is up to date'
  };
}


