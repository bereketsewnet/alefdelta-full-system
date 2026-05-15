import { query, execute } from '../../core/db.js';
import httpError from '../../core/utils/httpError.js';

export async function createRepayment(repayment, connection) {
  const conn = connection || null;
  await execute(
    `INSERT INTO loan_repayments 
    (repayment_id, loan_id, member_id, payment_date, amount_paid, principal_paid, 
     interest_paid, penalty_paid, balance_before, balance_after, payment_method, 
     bank_receipt_no, bank_receipt_photo_url,
     receipt_no, receipt_photo_url, notes, performed_by, idempotency_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      repayment.repayment_id,
      repayment.loan_id,
      repayment.member_id,
      repayment.payment_date,
      repayment.amount_paid,
      repayment.principal_paid,
      repayment.interest_paid,
      repayment.penalty_paid,
      repayment.balance_before,
      repayment.balance_after,
      repayment.payment_method,
      repayment.bank_receipt_no,
      repayment.bank_receipt_photo_url,
      repayment.receipt_no,
      repayment.receipt_photo_url,
      repayment.notes,
      repayment.performed_by,
      repayment.idempotency_key
    ],
    conn
  );
}

export async function listRepaymentsByLoan(loanId) {
  return query(
    'SELECT * FROM loan_repayments WHERE loan_id = ? ORDER BY payment_date DESC, created_at DESC',
    [loanId]
  );
}

export async function findRepaymentById(repaymentId) {
  const rows = await query('SELECT * FROM loan_repayments WHERE repayment_id = ?', [repaymentId]);
  return rows?.[0] || null;
}

export async function updateRepayment(repaymentId, updates, connection) {
  const conn = connection || null;
  const allowed = [
    'bank_receipt_no',
    'bank_receipt_photo_url',
    'receipt_no',
    'receipt_photo_url',
  ];

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates || {})) {
    if (!allowed.includes(key)) continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) {
    throw httpError(400, 'No valid fields to update');
  }

  values.push(repaymentId);
  const sql = `UPDATE loan_repayments SET ${fields.join(', ')}, created_at = created_at WHERE repayment_id = ?`;
  if (connection) {
    await connection.execute(sql, values);
  } else {
    await execute(sql, values);
  }
  return findRepaymentById(repaymentId);
}

export async function listRepaymentsByMember(memberId) {
  return query(
    'SELECT lr.*, la.applied_amount, la.approved_amount FROM loan_repayments lr JOIN loan_applications la ON lr.loan_id = la.loan_id WHERE lr.member_id = ? ORDER BY lr.payment_date DESC',
    [memberId]
  );
}

export async function getRepaymentSummary(loanId) {
  const rows = await query(
    `SELECT 
      COUNT(*) as total_payments,
      SUM(amount_paid) as total_paid,
      SUM(principal_paid) as total_principal,
      SUM(interest_paid) as total_interest,
      SUM(penalty_paid) as total_penalty,
      MAX(payment_date) as last_payment_date
    FROM loan_repayments 
    WHERE loan_id = ?`,
    [loanId]
  );
  return rows[0];
}

export async function updateLoanBalanceFields(loanId, updates, connection) {
  const conn = connection || null;
  const fields = [];
  const values = [];
  
  if (updates.outstanding_balance !== undefined) {
    fields.push('outstanding_balance = ?');
    values.push(updates.outstanding_balance);
  }
  if (updates.total_paid !== undefined) {
    fields.push('total_paid = ?');
    values.push(updates.total_paid);
  }
  if (updates.total_penalty !== undefined) {
    fields.push('total_penalty = ?');
    values.push(updates.total_penalty);
  }
  if (updates.last_payment_date !== undefined) {
    fields.push('last_payment_date = ?');
    values.push(updates.last_payment_date);
  }
  if (updates.next_payment_date !== undefined) {
    fields.push('next_payment_date = ?');
    values.push(updates.next_payment_date);
  }
  if (updates.payments_made !== undefined) {
    fields.push('payments_made = ?');
    values.push(updates.payments_made);
  }
  if (updates.is_fully_paid !== undefined) {
    fields.push('is_fully_paid = ?');
    values.push(updates.is_fully_paid);
  }
  
  values.push(loanId);
  
  const sql = `UPDATE loan_applications SET ${fields.join(', ')} WHERE loan_id = ?`;
  
  if (connection) {
    // Use connection's execute method when in transaction
    await connection.execute(sql, values);
  } else {
    // Use global execute when not in transaction
    await execute(sql, values);
  }
}


