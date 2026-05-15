import { query } from '../../core/db.js';

export async function insertTransaction(payload, connection) {
  await connection.execute(
    `INSERT INTO transactions
    (txn_id, account_id, txn_type, amount, balance_after, reference, receipt_photo_url, performed_by, idempotency_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      payload.txn_id,
      payload.account_id,
      payload.txn_type,
      payload.amount,
      payload.balance_after,
      payload.reference,
      payload.receipt_photo_url,
      payload.performed_by,
      payload.idempotency_key
    ]
  );
}

export async function listTransactions(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.account_id) {
    where.push('t.account_id = ?');
    params.push(filters.account_id);
  }
  if (filters.txn_type) {
    where.push('t.txn_type = ?');
    params.push(filters.txn_type);
  }
  if (filters.product_code) {
    where.push('a.product_code = ?');
    params.push(filters.product_code);
  }
  if (filters.date_from) {
    where.push('DATE(t.created_at) >= ?');
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    where.push('DATE(t.created_at) <= ?');
    params.push(filters.date_to);
  }
  if (filters.search) {
    where.push('(m.first_name LIKE ? OR m.last_name LIKE ? OR m.membership_no LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Number(filters.limit || 50);
  const offset = Number(filters.offset || 0);
  
  return query(
    `SELECT 
      t.txn_id,
      t.account_id,
      t.txn_type,
      t.amount,
      t.balance_after,
      t.reference,
      t.receipt_photo_url,
      t.performed_by,
      t.created_at,
      t.idempotency_key,
      a.product_code,
      a.member_id,
      m.first_name,
      m.last_name,
      m.membership_no,
      CONCAT(m.first_name, ' ', m.last_name) as member_name,
      u.username as performed_by_username
     FROM transactions t
     JOIN accounts a ON t.account_id = a.account_id
     JOIN members m ON a.member_id = m.member_id
     LEFT JOIN users u ON t.performed_by = u.user_id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
}

export async function findTransactionById(txnId) {
  const rows = await query('SELECT * FROM transactions WHERE txn_id = ?', [txnId]);
  return rows[0];
}

export async function updateTransactionReceipt(txnId, receiptPhotoUrl) {
  await query(
    'UPDATE transactions SET receipt_photo_url = ? WHERE txn_id = ?',
    [receiptPhotoUrl, txnId]
  );
}

export async function listTransactionsByMember(memberId, filters = {}) {
  const where = ['a.member_id = ?'];
  const params = [memberId];
  
  if (filters.txn_type) {
    where.push('t.txn_type = ?');
    params.push(filters.txn_type);
  }
  
  if (filters.date_from) {
    where.push('DATE(t.created_at) >= ?');
    params.push(filters.date_from);
  }
  
  if (filters.date_to) {
    where.push('DATE(t.created_at) <= ?');
    params.push(filters.date_to);
  }
  
  const whereClause = `WHERE ${where.join(' AND ')}`;
  const limit = Number(filters.limit || 50);
  const offset = Number(filters.offset || 0);
  
  try {
    // Build loan repayment WHERE clause
    const loanRepaymentWhere = ['lr.member_id = ?'];
    const loanRepaymentParams = [memberId];
    
    if (filters.date_from) {
      loanRepaymentWhere.push('DATE(lr.created_at) >= ?');
      loanRepaymentParams.push(filters.date_from);
    }
    if (filters.date_to) {
      loanRepaymentWhere.push('DATE(lr.created_at) <= ?');
      loanRepaymentParams.push(filters.date_to);
    }
    const loanRepaymentWhereClause = `WHERE ${loanRepaymentWhere.join(' AND ')}`;
    
    // Combine regular transactions and loan repayments
    const sql = `(
      SELECT 
        t.txn_id as id,
        t.account_id,
        t.txn_type,
        t.amount,
        t.balance_after,
        t.reference,
        t.receipt_photo_url,
        t.performed_by,
        t.created_at,
        t.idempotency_key,
        a.product_code,
        a.member_id,
        u.username as performed_by_username,
        u.role as performed_by_role,
        'TRANSACTION' as source_type,
        NULL as loan_id,
        NULL as payment_method
      FROM transactions t
      JOIN accounts a ON t.account_id = a.account_id
      LEFT JOIN users u ON t.performed_by = u.user_id
      ${whereClause}
    )
    UNION ALL
    (
      SELECT 
        lr.repayment_id as id,
        NULL as account_id,
        'LOAN_REPAYMENT' as txn_type,
        lr.amount_paid as amount,
        lr.balance_after as balance_after,
        lr.receipt_no as reference,
        lr.receipt_photo_url,
        lr.performed_by,
        lr.created_at,
        lr.idempotency_key,
        la.product_code,
        lr.member_id,
        u2.username as performed_by_username,
        u2.role as performed_by_role,
        'LOAN_REPAYMENT' as source_type,
        lr.loan_id,
        lr.payment_method
      FROM loan_repayments lr
      JOIN loan_applications la ON lr.loan_id = la.loan_id
      LEFT JOIN users u2 ON lr.performed_by = u2.user_id
      ${loanRepaymentWhereClause}
    )
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`;
    
    const queryParams = [...params, ...loanRepaymentParams, limit, offset];
    
    const results = await query(sql, queryParams);
    // Ensure we always return an array
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
}

