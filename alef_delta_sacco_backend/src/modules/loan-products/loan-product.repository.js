import { query, execute } from '../../core/db.js';

export async function listLoanProducts() {
  const rows = await query('SELECT * FROM loan_products ORDER BY product_code');
  // Map database column names to frontend expected format
  return Array.isArray(rows) ? rows.map(row => ({
    code: row.product_code,
    name: row.name,
    interest_rate: Number(row.interest_rate),
    interest_type: row.interest_type,
    min_term_months: Number(row.min_term_months),
    max_term_months: Number(row.max_term_months),
    penalty_rate: Number(row.penalty_rate || 0),
    category: row.category || null
  })) : [];
}

export async function findLoanProductByCode(productCode) {
  const rows = await query('SELECT * FROM loan_products WHERE product_code = ?', [productCode]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    code: row.product_code,
    name: row.name,
    interest_rate: Number(row.interest_rate),
    interest_type: row.interest_type,
    min_term_months: Number(row.min_term_months),
    max_term_months: Number(row.max_term_months),
    penalty_rate: Number(row.penalty_rate || 0),
    category: row.category || null
  };
}

export async function createLoanProduct(product) {
  await execute(
    `INSERT INTO loan_products 
    (product_code, name, interest_rate, interest_type, min_term_months, max_term_months, penalty_rate, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.product_code,
      product.name,
      product.interest_rate,
      product.interest_type,
      product.min_term_months,
      product.max_term_months,
      product.penalty_rate || 0,
      product.category || null
    ]
  );
  return findLoanProductByCode(product.product_code);
}

export async function updateLoanProduct(productCode, updates) {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.interest_rate !== undefined) {
    fields.push('interest_rate = ?');
    values.push(updates.interest_rate);
  }
  if (updates.interest_type !== undefined) {
    fields.push('interest_type = ?');
    values.push(updates.interest_type);
  }
  if (updates.min_term_months !== undefined) {
    fields.push('min_term_months = ?');
    values.push(updates.min_term_months);
  }
  if (updates.max_term_months !== undefined) {
    fields.push('max_term_months = ?');
    values.push(updates.max_term_months);
  }
  if (updates.penalty_rate !== undefined) {
    fields.push('penalty_rate = ?');
    values.push(updates.penalty_rate);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }
  
  if (fields.length === 0) {
    return findLoanProductByCode(productCode);
  }
  
  values.push(productCode);
  await execute(
    `UPDATE loan_products SET ${fields.join(', ')} WHERE product_code = ?`,
    values
  );
  return findLoanProductByCode(productCode);
}

export async function deleteLoanProduct(productCode) {
  // Check if product is used in any loan applications
  const usageRows = await query(
    'SELECT COUNT(*) as count FROM loan_applications WHERE product_code = ?',
    [productCode]
  );
  
  const usage = Array.isArray(usageRows) ? usageRows[0] : usageRows;
  const count = Number(usage?.count || 0);
  
  if (count > 0) {
    throw new Error(`Cannot delete loan product: ${productCode} is used in ${count} loan application(s)`);
  }
  
  await execute('DELETE FROM loan_products WHERE product_code = ?', [productCode]);
  return true;
}

