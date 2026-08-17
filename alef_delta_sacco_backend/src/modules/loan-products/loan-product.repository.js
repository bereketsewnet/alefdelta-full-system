import { query, execute } from '../../core/db.js';
import { listTiersByProduct, listTiersForProducts } from './loan-tier.repository.js';

function executor(connection) {
  if (!connection) return { query, execute };
  return {
    query: async (sql, params = []) => (await connection.query(sql, params))[0],
    execute: async (sql, params = []) => (await connection.execute(sql, params))[0]
  };
}

function mapProduct(row) {
  return {
    code: row.product_code,
    name: row.name,
    interest_rate: Number(row.interest_rate),
    interest_type: row.interest_type,
    min_term_months: Number(row.min_term_months),
    max_term_months: Number(row.max_term_months),
    penalty_rate: Number(row.penalty_rate || 0),
    is_active: Boolean(row.is_active),
    penalty_mode: row.penalty_mode || 'PERCENT',
    penalty_fixed_amount: Number(row.penalty_fixed_amount || 0),
    penalty_grace_days: Number(row.penalty_grace_days || 0),
    penalty_escalation_enabled: Boolean(row.penalty_escalation_enabled),
    penalty_escalation_value: Number(row.penalty_escalation_value || 0),
    service_charge_mode: row.service_charge_mode || 'PERCENT', service_charge_rate: Number(row.service_charge_rate || 0), service_charge_fixed_amount: Number(row.service_charge_fixed_amount || 0),
    category: row.category || null,
    loan_category: row.loan_category || null,
    min_savings_duration_months: row.min_savings_duration_months != null ? Number(row.min_savings_duration_months) : null,
    loan_amount_min_etb: row.loan_amount_min_etb != null ? Number(row.loan_amount_min_etb) : null,
    loan_amount_max_etb: row.loan_amount_max_etb != null ? Number(row.loan_amount_max_etb) : null,
    required_pre_savings_pct: row.required_pre_savings_pct != null ? Number(row.required_pre_savings_pct) : null,
    required_share_purchase_pct: row.required_share_purchase_pct != null ? Number(row.required_share_purchase_pct) : null,
    eligible_savings_types: row.eligible_savings_types || null,
    requires_lump_sum_pre_savings: Boolean(row.requires_lump_sum_pre_savings)
  };
}

export async function listLoanProducts() {
  const rows = await query('SELECT * FROM loan_products WHERE is_active = 1 ORDER BY product_code');
  if (!Array.isArray(rows)) return [];
  const tiers = await listTiersForProducts(rows.map((row) => row.product_code));
  return rows.map((row) => ({ ...mapProduct(row), tiers: tiers.get(row.product_code) || [] }));
}

export async function findLoanProductByCode(productCode, connection) {
  const db = executor(connection);
  const rows = await db.query('SELECT * FROM loan_products WHERE product_code = ?', [productCode]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const product = mapProduct(rows[0]);
  return { ...product, tiers: await listTiersByProduct(productCode, { connection }) };
}

export async function createLoanProduct(product, connection) {
  const db = executor(connection);
  await db.execute(
    `INSERT INTO loan_products
    (product_code, name, interest_rate, interest_type, min_term_months, max_term_months, penalty_rate, category,
      loan_category, min_savings_duration_months, loan_amount_min_etb, loan_amount_max_etb,
      required_pre_savings_pct, eligible_savings_types, requires_lump_sum_pre_savings, penalty_mode, penalty_fixed_amount, penalty_grace_days, penalty_escalation_enabled, penalty_escalation_value, service_charge_mode, service_charge_rate, service_charge_fixed_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      product.requires_lump_sum_pre_savings ? 1 : 0, product.penalty_mode || 'PERCENT', product.penalty_fixed_amount || 0, product.penalty_grace_days || 0, product.penalty_escalation_enabled ? 1 : 0, product.penalty_escalation_value || 0, product.service_charge_mode || 'PERCENT', product.service_charge_rate || 0, product.service_charge_fixed_amount || 0
    ]
  );
  return findLoanProductByCode(product.product_code, connection);
}

export async function updateLoanProduct(productCode, updates, connection) {
  const db = executor(connection);
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
  for (const key of ['penalty_mode', 'penalty_fixed_amount', 'penalty_grace_days', 'penalty_escalation_enabled', 'penalty_escalation_value']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(key === 'penalty_escalation_enabled' ? (updates[key] ? 1 : 0) : updates[key]); }
  }
  for (const key of ['service_charge_mode', 'service_charge_rate', 'service_charge_fixed_amount']) if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
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
    return findLoanProductByCode(productCode, connection);
  }
  
  values.push(productCode);
  await db.execute(
    `UPDATE loan_products SET ${fields.join(', ')} WHERE product_code = ?`,
    values
  );
  return findLoanProductByCode(productCode, connection);
}

export async function deleteLoanProduct(productCode) {
  await execute('UPDATE loan_products SET is_active = 0 WHERE product_code = ?', [productCode]);
  return true;
}
