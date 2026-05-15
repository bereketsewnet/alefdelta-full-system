import httpError from '../../core/utils/httpError.js';
import { query } from '../../core/db.js';
import { findMemberById } from '../members/member.repository.js';
import { listTransactions, listTransactionsByMember } from '../transactions/transaction.repository.js';

export async function getClientProfile(memberId) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  // Get account summaries
  const accounts = await query('SELECT * FROM accounts WHERE member_id = ?', [memberId]);
  const totalSavings = accounts
    .filter(a => a.product_code.startsWith('SAV_'))
    .reduce((sum, a) => sum + Number(a.balance), 0);
  
  // Get active loans
  const loans = await query(
    'SELECT * FROM loan_applications WHERE member_id = ? AND workflow_status IN (?, ?) AND (is_fully_paid IS NULL OR is_fully_paid = 0)',
    [memberId, 'APPROVED', 'DISBURSED']
  );
  // Use outstanding_balance if available, otherwise fall back to approved_amount
  const totalLoanOutstanding = loans.reduce((sum, l) => {
    const balance = l.outstanding_balance !== null && l.outstanding_balance !== undefined 
      ? Number(l.outstanding_balance) 
      : Number(l.approved_amount || 0);
    return sum + balance;
  }, 0);
  
  // Get next payment - find the earliest next_payment_date from all active loans
  const loansWithNextPayment = loans.filter(l => l.next_payment_date);
  const nextPayment = loansWithNextPayment.length > 0 
    ? loansWithNextPayment.sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date))[0].next_payment_date
    : null;
  
  // Build address string from components
  const addressParts = [
    member.address_subcity,
    member.address_woreda,
    member.address_house_no
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : null;

  return {
    member: {
      member_id: member.member_id,
      membership_no: member.membership_no,
      first_name: member.first_name,
      middle_name: member.middle_name,
      last_name: member.last_name,
      phone_primary: member.phone_primary,
      email: member.email,
      gender: member.gender,
      marital_status: member.marital_status,
      address: address,
      address_subcity: member.address_subcity,
      address_woreda: member.address_woreda,
      address_house_no: member.address_house_no,
      member_type: member.member_type,
      monthly_income: member.monthly_income,
      tin_number: member.tin_number,
      status: member.status,
      registered_date: member.registered_date,
      telegram_chat_id: member.telegram_chat_id,
      created_at: member.registered_date || member.created_at
    },
    summary: {
      total_savings: totalSavings,
      total_loan_outstanding: totalLoanOutstanding,
      next_payment_date: nextPayment,
      active_loans_count: loans.length
    }
  };
}

export async function getClientAccounts(memberId) {
  const accounts = await query('SELECT * FROM accounts WHERE member_id = ?', [memberId]);
  return accounts.map(a => ({
    account_id: a.account_id,
    product_code: a.product_code,
    balance: a.balance,
    lien_amount: a.lien_amount,
    available_balance: Number(a.balance) - Number(a.lien_amount || 0),
    currency: a.currency,
    status: a.status,
    created_at: a.created_at
  }));
}

export async function getClientAccountTransactions(memberId, accountId, filters = {}) {
  // Verify account belongs to member
  const accountRows = await query('SELECT * FROM accounts WHERE account_id = ? AND member_id = ?', [accountId, memberId]);
  if (accountRows.length === 0) {
    throw httpError(403, 'Account does not belong to this member');
  }
  
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  
  const transactions = await listTransactions({ account_id: accountId, limit, offset });
  return transactions;
}

export async function getClientTransactions(memberId, filters = {}) {
  // Get all transactions for member across all accounts
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  
  const transactions = await listTransactionsByMember(memberId, { limit, offset, ...filters });
  return transactions;
}

export async function getClientLoans(memberId) {
  const loans = await query('SELECT * FROM loan_applications WHERE member_id = ? ORDER BY created_at DESC', [memberId]);
  
  // Import schedule builder to calculate monthly installment
  const { buildSchedule, calculateInstallment } = await import('../loans/gatekeeper.js');
  
  return loans.map(l => {
    // Calculate monthly installment
    let monthly_installment = 0;
    if (l.approved_amount && l.interest_rate && l.term_months && l.workflow_status === 'APPROVED') {
      try {
        const installmentInfo = calculateInstallment({
          principal: Number(l.approved_amount),
          interestRate: Number(l.interest_rate),
          interestType: l.interest_type || 'FLAT',
          termMonths: Number(l.term_months)
        });
        monthly_installment = installmentInfo.installment || 0;
      } catch (err) {
        console.error('Error calculating installment for loan', l.loan_id, err);
      }
    }
    
    return {
      loan_id: l.loan_id,
      product_code: l.product_code,
      applied_amount: l.applied_amount,
      approved_amount: l.approved_amount,
      outstanding_balance: l.outstanding_balance !== null && l.outstanding_balance !== undefined 
        ? Number(l.outstanding_balance) 
        : (l.approved_amount ? Number(l.approved_amount) : 0),
      total_paid: Number(l.total_paid || 0),
      term_months: l.term_months,
      interest_rate: l.interest_rate,
      interest_type: l.interest_type,
      workflow_status: l.workflow_status,
      disbursement_date: l.disbursement_date,
      next_payment_date: l.next_payment_date,
      monthly_installment: monthly_installment,
      is_fully_paid: l.is_fully_paid || false,
      created_at: l.created_at
    };
  });
}

export async function getClientLoanSchedule(memberId, loanId) {
  // Verify loan belongs to member
  const loanRows = await query('SELECT * FROM loan_applications WHERE loan_id = ? AND member_id = ?', [loanId, memberId]);
  if (loanRows.length === 0) {
    throw httpError(403, 'Loan does not belong to this member');
  }
  
  const loan = loanRows[0];
  
  // Import schedule builder
  const { buildSchedule } = await import('../loans/gatekeeper.js');
  const schedule = buildSchedule(loan, loan.disbursement_date || new Date());
  
  // Calculate monthly installment
  const { calculateInstallment } = await import('../loans/gatekeeper.js');
  let monthly_installment = 0;
  if (loan.approved_amount && loan.interest_rate && loan.term_months && loan.workflow_status === 'APPROVED') {
    try {
      const installmentInfo = calculateInstallment({
        principal: Number(loan.approved_amount),
        interestRate: Number(loan.interest_rate),
        interestType: loan.interest_type || 'FLAT',
        termMonths: Number(loan.term_months)
      });
      monthly_installment = installmentInfo.installment || 0;
    } catch (err) {
      console.error('Error calculating installment for loan', loan.loan_id, err);
    }
  }
  
  return {
    loan: {
      loan_id: loan.loan_id,
      product_code: loan.product_code,
      product_name: loan.product_code || 'Loan',
      applied_amount: loan.applied_amount,
      approved_amount: loan.approved_amount,
      outstanding_balance: loan.outstanding_balance !== null && loan.outstanding_balance !== undefined 
        ? Number(loan.outstanding_balance) 
        : (loan.approved_amount ? Number(loan.approved_amount) : 0),
      total_paid: Number(loan.total_paid || 0),
      total_interest: 0, // TODO: Calculate from repayments
      total_penalty: Number(loan.total_penalty || 0),
      term_months: loan.term_months,
      interest_rate: loan.interest_rate,
      interest_type: loan.interest_type,
      workflow_status: loan.workflow_status,
      status: loan.workflow_status, // For frontend compatibility
      monthly_installment: monthly_installment,
      next_payment_date: loan.next_payment_date,
      disbursement_date: loan.disbursement_date,
      disbursed_at: loan.disbursement_date,
      days_overdue: 0, // TODO: Calculate from next_payment_date
      is_fully_paid: loan.is_fully_paid || false,
      created_at: loan.created_at
    },
    schedule
  };
}

