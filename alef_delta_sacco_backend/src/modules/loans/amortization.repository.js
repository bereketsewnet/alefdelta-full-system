import { query } from '../../core/db.js';

const executor = (connection) => connection || { query: async (sql, params) => [await query(sql, params)] };

export async function replaceLoanSchedule(loanId, rows, connection) {
  const db = executor(connection);
  await db.query('DELETE FROM loan_amortization_schedule WHERE loan_id = ?', [loanId]);
  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    await db.query(`INSERT INTO loan_amortization_schedule
      (loan_id, installment_no, due_date, opening_balance, scheduled_payment, scheduled_principal, scheduled_interest, closing_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [loanId, row.installment_no, row.due_date, row.opening_balance, row.scheduled_payment, row.scheduled_principal, row.scheduled_interest, row.closing_balance]);
  }
}

export async function listLoanSchedule(loanId, connection, forUpdate = false) {
  const db = executor(connection);
  const [rows] = await db.query(`SELECT * FROM loan_amortization_schedule WHERE loan_id = ? ORDER BY installment_no ${forUpdate ? 'FOR UPDATE' : ''}`, [loanId]);
  return rows;
}

export async function updateSchedulePayment(loanId, installmentNo, values, connection) {
  const db = executor(connection);
  await db.query(`UPDATE loan_amortization_schedule SET principal_paid = ?, interest_paid = ?, status = ?, paid_at = ? WHERE loan_id = ? AND installment_no = ?`, [values.principal_paid, values.interest_paid, values.status, values.paid_at, loanId, installmentNo]);
}

export async function replaceUnpaidSchedule(loanId, rows, connection) {
  const db = executor(connection);
  await db.query("DELETE FROM loan_amortization_schedule WHERE loan_id = ? AND status <> 'PAID'", [loanId]);
  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    await db.query(`INSERT INTO loan_amortization_schedule
      (loan_id, installment_no, due_date, opening_balance, scheduled_payment, scheduled_principal, scheduled_interest, closing_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [loanId, row.installment_no, row.due_date, row.opening_balance, row.scheduled_payment, row.scheduled_principal, row.scheduled_interest, row.closing_balance]);
  }
}
