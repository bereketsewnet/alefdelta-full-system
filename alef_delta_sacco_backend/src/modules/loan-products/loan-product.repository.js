import { query, execute } from '../../core/db.js';

function mapProduct(row) {
  return {
    code: row.product_code,
    name: row.name,
    interest_rate: Number(row.interest_rate),
    interest_type: row.interest_type,
    min_term_months: Number(row.min_term_months),
    max_term_months: Number(row.max_term_months),
    penalty_rate: Number(row.penalty_rate || 0),
    category: row.category || null,
    loan_category: row.loan_category || null,
    min_savings_duration_months: row.min_savings_duration_months != null ? Number(row.min_savings_duration_months) : null,
    loan_amount_min_etb: row.loan_amount_min_etb != null ? Number(row.loan_amount_min_etb) : null,
    loan_amount_max_etb: row.loan_amount_max_etb != null ? Number(row.loan_amount_max_etb) : null,
    required_pre_savings_pct: row.required_pre_savings_pct != null ? Number(row.required_pre_savings_pct) : null,
    eligible_savings_types: row.eligible_savings_types || null,
    requires_lump_sum_pre_savings: Boolean(row.requires_lump_sum_pre_savings)
  };
}

export async function listLoanProducts() {
  const rows = await query('SELECT * FROM loan_products ORDER BY product_code');
  return Array.isArray(rows) ? rows.map(mapProduct) : [];
}

export async function findLoanProductByCode(productCode) {
  const rows = await query('SELECT * FROM loan_products WHERE product_code = ?', [productCode]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return mapProduct(rows[0]);
}

export async function createLoanProduct(product) {
  await execute(
    `INSERT INTO loan_products
    (product_code, name, interest_rate, interest_type, min_term_months, max_term_months, penalty_rate, category,
      loan_category, min_savings_duration_months, loan_amount_min_etb, loan_amount_max_etb,
      required_pre_savings_pct, eligible_savings_types, requires_lump_sum_pre_savings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.product_code,
      product.name,
      product.interest_rate,
      product.interest_type,
      product.min_term_months,
      product.max_term_months,
      product.penalty_rate || 0,
      product.category || null,
      product.loan_category || null,
      product.min_savings_duration_months ?? null,
      product.loan_amount_min_etb ?? null,
      product.loan_amount_max_etb ?? null,
      product.required_pre_savings_pct ?? null,
      product.eligible_savings_types || null,
      product.requires_lump_sum_pre_savings ? 1 : 0
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
  if (updates.loan_category !== undefined) {
    fields.push('loan_category = ?');
    values.push(updates.loan_category || null);
  }
  if (updates.min_savings_duration_months !== undefined) {
    fields.push('min_savings_duration_months = ?');
    values.push(updates.min_savings_duration_months ?? null);
  }
  if (updates.loan_amount_min_etb !== undefined) {
    fields.push('loan_amount_min_etb = ?');
    values.push(updates.loan_amount_min_etb ?? null);
  }
  if (updates.loan_amount_max_etb !== undefined) {
    fields.push('loan_amount_max_etb = ?');
    values.push(updates.loan_amount_max_etb ?? null);
  }
  if (updates.required_pre_savings_pct !== undefined) {
    fields.push('required_pre_savings_pct = ?');
    values.push(updates.required_pre_savings_pct ?? null);
  }
  if (updates.eligible_savings_types !== undefined) {
    fields.push('eligible_savings_types = ?');
    values.push(updates.eligible_savings_types || null);
  }
  if (updates.requires_lump_sum_pre_savings !== undefined) {
    fields.push('requires_lump_sum_pre_savings = ?');
    values.push(updates.requires_lump_sum_pre_savings ? 1 : 0);
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

