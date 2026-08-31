import { execute, query } from '../../core/db.js';

function getExecutor(connection) {
  if (connection) {
    return {
      query: (sql, params) => connection.query(sql, params),
      execute: (sql, params) => connection.execute(sql, params)
    };
  }
  return { query, execute };
}

export async function findLoanProductByCode(code) {
  const rows = await query('SELECT * FROM loan_products WHERE product_code = ?', [code]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function createLoanApplication(record, connection) {
  const executor = getExecutor(connection);
  await executor.execute(
    `INSERT INTO loan_applications
    (loan_id, member_id, product_code, selected_tier_id, applied_amount, approved_amount, term_months, interest_rate,
    interest_type, penalty_rate, penalty_mode, penalty_fixed_amount, penalty_grace_days, penalty_escalation_enabled, penalty_escalation_value, service_charge_mode, service_charge_rate, service_charge_fixed_amount, service_charge_amount, borrower_age, insurance_enabled, insurance_ceiling_rate, insurance_rate, insurance_premium, insurance_renewal_date,
    fee_payment_method, fee_receipt_number, fee_receipt_url, gross_disbursement_amount, total_upfront_fee_amount, net_disbursement_amount, fee_collection_status, insurance_escrow_status,
    purpose_description, repayment_frequency, workflow_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      record.loan_id,
      record.member_id,
      record.product_code,
      record.selected_tier_id,
      record.applied_amount,
      record.approved_amount,
      record.term_months,
      record.interest_rate,
      record.interest_type,
      record.penalty_rate, record.penalty_mode, record.penalty_fixed_amount, record.penalty_grace_days, record.penalty_escalation_enabled ? 1 : 0, record.penalty_escalation_value,
      record.service_charge_mode, record.service_charge_rate, record.service_charge_fixed_amount, record.service_charge_amount,
      record.borrower_age, record.insurance_enabled ? 1 : 0, record.insurance_ceiling_rate, record.insurance_rate, record.insurance_premium, record.insurance_renewal_date,
      record.fee_payment_method, record.fee_receipt_number, record.fee_receipt_url, record.gross_disbursement_amount,
      record.total_upfront_fee_amount, record.net_disbursement_amount, record.fee_collection_status, record.insurance_escrow_status,
      record.purpose_description,
      record.repayment_frequency,
      record.workflow_status
    ]
  );
}

export async function findLoanById(loanId, connection) {
  if (connection) {
    // When using a connection, query returns [rows, fields]
    const [rows] = await connection.query('SELECT * FROM loan_applications WHERE loan_id = ?', [loanId]);
    return rows[0];
  } else {
    // When using global query, it already returns just rows (array)
    const rows = await query('SELECT * FROM loan_applications WHERE loan_id = ?', [loanId]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }
}

export async function updateLoan(loanId, updates, connection) {
  const executor = getExecutor(connection);
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  if (!fields.length) return;
  params.push(loanId);
  await executor.execute(
    `UPDATE loan_applications SET ${fields.join(', ')}, updated_at = NOW() WHERE loan_id = ?`,
    params
  );
}

export async function listLoans(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.workflow_status) {
    where.push('l.workflow_status = ?');
    params.push(filters.workflow_status);
  }
  if (filters.member_id) {
    where.push('l.member_id = ?'); // Specify table alias to avoid ambiguity
    params.push(filters.member_id);
  }
  if (filters.product_code) {
    where.push('l.product_code = ?');
    params.push(filters.product_code);
  }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Number(filters.limit || 50);
  const offset = Number(filters.offset || 0);
  
  // Get total count (use alias for consistency)
  const countRows = await query(
    `SELECT COUNT(*) as total FROM loan_applications l ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;
  
  // Get loans with member info (use LEFT JOIN to include loans even if member is missing)
  const sql = `SELECT 
    l.*,
    m.first_name,
    m.last_name,
    m.membership_no,
    COALESCE(CONCAT(m.first_name, ' ', m.last_name), 'Unknown Member') as member_name
   FROM loan_applications l
   LEFT JOIN members m ON l.member_id = m.member_id
   ${whereClause}
   ORDER BY l.created_at DESC
   LIMIT ? OFFSET ?`;
  
  const rows = await query(sql, [...params, limit, offset]);
  
  return {
    data: Array.isArray(rows) ? rows : [],
    total: Number(total),
    limit,
    offset
  };
}
