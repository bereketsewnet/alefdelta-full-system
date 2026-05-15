import { query, execute } from '../../core/db.js';

export async function findAccountById(accountId, connection) {
  const executor = connection || { query };
  const [rows] =
    connection?.query
      ? await connection.query('SELECT * FROM accounts WHERE account_id = ?', [accountId])
      : await query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);
  return rows?.[0] || rows;
}

export async function listAccountsByMember(memberId) {
  return query('SELECT * FROM accounts WHERE member_id = ?', [memberId]);
}

export async function listAccounts(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.member_id) {
    where.push('member_id = ?');
    params.push(filters.member_id);
  }
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  if (filters.product_code) {
    where.push('product_code = ?');
    params.push(filters.product_code);
  }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  const rows = await query(
    `SELECT * FROM accounts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

export async function countAccounts(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.member_id) {
    where.push('member_id = ?');
    params.push(filters.member_id);
  }
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(`SELECT COUNT(*) as total FROM accounts ${whereClause}`, params);
  return rows[0].total;
}

export async function createAccount(account) {
  await execute(
    `INSERT INTO accounts 
    (account_id, member_id, product_code, balance, lien_amount, currency, metadata, interest_method, status, version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      account.account_id,
      account.member_id,
      account.product_code,
      account.balance || 0,
      account.lien_amount || 0,
      account.currency || 'ETB',
      account.metadata ? JSON.stringify(account.metadata) : null,
      account.interest_method || 'STANDARD',
      account.status || 'ACTIVE',
      1
    ]
  );
}

export async function updateAccount(accountId, updates) {
  const fields = [];
  const params = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'account_id' && key !== 'member_id' && key !== 'version') {
      fields.push(`${key} = ?`);
      if (key === 'metadata') {
        params.push(value ? JSON.stringify(value) : null);
      } else {
        params.push(value);
      }
    }
  });
  
  if (!fields.length) return;
  
  params.push(accountId);
  await execute(
    `UPDATE accounts SET ${fields.join(', ')}, updated_at = NOW() WHERE account_id = ?`,
    params
  );
}
