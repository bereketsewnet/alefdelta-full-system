import { query, execute } from '../../core/db.js';

function mapAccountProduct(row) {
  if (!row) return null;
  return {
    product_code: row.product_code,
    name: row.name,
    description: row.description || null,
    category: row.category || null,
    product_kind: row.product_kind || 'STANDARD',
    is_active: Boolean(row.is_active),
    guardian_required: Boolean(row.guardian_required),
    commodity_required: Boolean(row.commodity_required),
    target_required: Boolean(row.target_required),
    default_commodity_type: row.default_commodity_type || null,
    min_balance: Number(row.min_balance || 0),
    min_deposit: Number(row.min_deposit || 0),
    interest_rate: Number(row.interest_rate || 0),
    withdrawal_policy: row.withdrawal_policy || null,
    metadata_schema: row.metadata_schema || null,
    notes: row.notes || null,
    interest_method: row.interest_method || 'STANDARD',
    profit_share_ratio: Number(row.profit_share_ratio || 0),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function listAccountProducts() {
  const rows = await query('SELECT * FROM account_products ORDER BY category, name');
  return Array.isArray(rows) ? rows.map(mapAccountProduct) : [];
}

export async function findAccountProductByCode(productCode) {
  const rows = await query('SELECT * FROM account_products WHERE product_code = ?', [productCode]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return mapAccountProduct(rows[0]);
}

export async function createAccountProduct(product) {
  await execute(
    `INSERT INTO account_products 
    (product_code, name, description, category, product_kind, guardian_required, commodity_required, target_required, default_commodity_type, is_active, min_balance, min_deposit, interest_rate, withdrawal_policy, metadata_schema, notes, interest_method, profit_share_ratio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.product_code,
      product.name,
      product.description || null,
      product.category || null,
      product.product_kind || 'STANDARD',
      product.guardian_required ? 1 : 0,
      product.commodity_required ? 1 : 0,
      product.target_required ? 1 : 0,
      product.default_commodity_type || null,
      product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1,
      product.min_balance ?? 0,
      product.min_deposit ?? 0,
      product.interest_rate ?? 0,
      product.withdrawal_policy || null,
      product.metadata_schema || null,
      product.notes || null,
      product.interest_method || 'STANDARD',
      product.profit_share_ratio ?? 0
    ]
  );
  return findAccountProductByCode(product.product_code);
}

export async function updateAccountProduct(productCode, updates) {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }
  if (updates.product_kind !== undefined) {
    fields.push('product_kind = ?');
    values.push(updates.product_kind);
  }
  if (updates.guardian_required !== undefined) {
    fields.push('guardian_required = ?');
    values.push(updates.guardian_required ? 1 : 0);
  }
  if (updates.commodity_required !== undefined) {
    fields.push('commodity_required = ?');
    values.push(updates.commodity_required ? 1 : 0);
  }
  if (updates.target_required !== undefined) {
    fields.push('target_required = ?');
    values.push(updates.target_required ? 1 : 0);
  }
  if (updates.default_commodity_type !== undefined) {
    fields.push('default_commodity_type = ?');
    values.push(updates.default_commodity_type || null);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }
  if (updates.min_balance !== undefined) {
    fields.push('min_balance = ?');
    values.push(updates.min_balance);
  }
  if (updates.interest_rate !== undefined) {
    fields.push('interest_rate = ?');
    values.push(updates.interest_rate);
  }
  if (updates.min_deposit !== undefined) {
    fields.push('min_deposit = ?');
    values.push(updates.min_deposit);
  }
  if (updates.withdrawal_policy !== undefined) {
    fields.push('withdrawal_policy = ?');
    values.push(updates.withdrawal_policy || null);
  }
  if (updates.metadata_schema !== undefined) {
    fields.push('metadata_schema = ?');
    values.push(updates.metadata_schema || null);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes || null);
  }
  if (updates.interest_method !== undefined) {
    fields.push('interest_method = ?');
    values.push(updates.interest_method);
  }
  if (updates.profit_share_ratio !== undefined) {
    fields.push('profit_share_ratio = ?');
    values.push(updates.profit_share_ratio);
  }
  
  if (fields.length === 0) {
    return findAccountProductByCode(productCode);
  }
  
  values.push(productCode);
  await execute(
    `UPDATE account_products SET ${fields.join(', ')}, updated_at = NOW() WHERE product_code = ?`,
    values
  );
  return findAccountProductByCode(productCode);
}

export async function deleteAccountProduct(productCode) {
  // Check if product is used in any accounts
  const usageRows = await query(
    'SELECT COUNT(*) as count FROM accounts WHERE product_code = ?',
    [productCode]
  );
  
  const usage = Array.isArray(usageRows) ? usageRows[0] : usageRows;
  const count = Number(usage?.count || 0);
  
  if (count > 0) {
    throw new Error(`Cannot delete account product: ${productCode} is used in ${count} account(s)`);
  }
  
  await execute('DELETE FROM account_products WHERE product_code = ?', [productCode]);
  return true;
}
