import { query } from '../../core/db.js';

function executor(connection) {
  return connection
    ? { query: async (sql, params = []) => (await connection.query(sql, params))[0] }
    : { query };
}

export function mapTier(row, eligibleSavingsProducts = []) {
  if (!row) return null;
  return {
    tier_id: row.tier_id,
    product_code: row.product_code,
    tier_code: row.tier_code,
    name: row.name,
    display_order: Number(row.display_order || 0),
    min_savings_duration_months: Number(row.min_savings_duration_months || 0),
    loan_amount_min_etb: Number(row.loan_amount_min_etb || 0),
    loan_amount_max_etb: row.loan_amount_max_etb == null ? null : Number(row.loan_amount_max_etb),
    max_term_months: Number(row.max_term_months),
    interest_rate: Number(row.interest_rate),
    required_pre_savings_pct: Number(row.required_pre_savings_pct || 0),
    required_share_purchase_pct: Number(row.required_share_purchase_pct || 0),
    eligible_savings_products: eligibleSavingsProducts,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function attachEligibleProducts(rows, connection) {
  if (!rows.length) return [];
  const db = executor(connection);
  const ids = rows.map((row) => row.tier_id);
  const placeholders = ids.map(() => '?').join(',');
  const eligible = await db.query(
    `SELECT tier_id, account_product_code FROM loan_tier_eligible_account_products
     WHERE tier_id IN (${placeholders}) ORDER BY account_product_code`,
    ids
  );
  const byTier = new Map();
  eligible.forEach((row) => {
    const items = byTier.get(row.tier_id) || [];
    items.push(row.account_product_code);
    byTier.set(row.tier_id, items);
  });
  return rows.map((row) => mapTier(row, byTier.get(row.tier_id) || []));
}

export async function listTiersByProduct(productCode, { includeInactive = false, connection } = {}) {
  const db = executor(connection);
  const rows = await db.query(
    `SELECT * FROM loan_product_tiers WHERE product_code = ?
     ${includeInactive ? '' : 'AND is_active = 1'}
     ORDER BY display_order, loan_amount_min_etb, tier_code`,
    [productCode]
  );
  return attachEligibleProducts(rows, connection);
}

export async function listTiersForProducts(productCodes, { includeInactive = false, connection } = {}) {
  if (!productCodes.length) return new Map();
  const db = executor(connection);
  const placeholders = productCodes.map(() => '?').join(',');
  const rows = await db.query(
    `SELECT * FROM loan_product_tiers WHERE product_code IN (${placeholders})
     ${includeInactive ? '' : 'AND is_active = 1'}
     ORDER BY product_code, display_order, loan_amount_min_etb, tier_code`,
    productCodes
  );
  const tiers = await attachEligibleProducts(rows, connection);
  const grouped = new Map(productCodes.map((code) => [code, []]));
  tiers.forEach((tier) => grouped.get(tier.product_code)?.push(tier));
  return grouped;
}

export async function findTierById(tierId, { includeInactive = false, connection } = {}) {
  const db = executor(connection);
  const rows = await db.query(
    `SELECT * FROM loan_product_tiers WHERE tier_id = ? ${includeInactive ? '' : 'AND is_active = 1'}`,
    [tierId]
  );
  const tiers = await attachEligibleProducts(rows, connection);
  return tiers[0] || null;
}

export async function replaceProductTiers(productCode, tiers, connection) {
  const db = executor(connection);
  const retainedIds = [];
  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index];
    const tierId = tier.tier_id;
    retainedIds.push(tierId);
    // eslint-disable-next-line no-await-in-loop
    await db.query(
      `INSERT INTO loan_product_tiers
       (tier_id, product_code, tier_code, name, display_order, min_savings_duration_months,
        loan_amount_min_etb, loan_amount_max_etb, max_term_months, interest_rate,
        required_pre_savings_pct, required_share_purchase_pct, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE tier_code = VALUES(tier_code), name = VALUES(name),
        display_order = VALUES(display_order), min_savings_duration_months = VALUES(min_savings_duration_months),
        loan_amount_min_etb = VALUES(loan_amount_min_etb), loan_amount_max_etb = VALUES(loan_amount_max_etb),
        max_term_months = VALUES(max_term_months), interest_rate = VALUES(interest_rate),
        required_pre_savings_pct = VALUES(required_pre_savings_pct),
        required_share_purchase_pct = VALUES(required_share_purchase_pct), is_active = 1`,
      [tierId, productCode, tier.tier_code, tier.name, tier.display_order ?? index + 1,
        tier.min_savings_duration_months, tier.loan_amount_min_etb, tier.loan_amount_max_etb,
        tier.max_term_months, tier.interest_rate, tier.required_pre_savings_pct,
        tier.required_share_purchase_pct]
    );
    // eslint-disable-next-line no-await-in-loop
    await db.query('DELETE FROM loan_tier_eligible_account_products WHERE tier_id = ?', [tierId]);
    for (const accountProductCode of tier.eligible_savings_products) {
      // eslint-disable-next-line no-await-in-loop
      await db.query(
        'INSERT INTO loan_tier_eligible_account_products (tier_id, account_product_code) VALUES (?, ?)',
        [tierId, accountProductCode]
      );
    }
  }
  if (retainedIds.length) {
    const placeholders = retainedIds.map(() => '?').join(',');
    await db.query(
      `UPDATE loan_product_tiers SET is_active = 0 WHERE product_code = ? AND tier_id NOT IN (${placeholders})`,
      [productCode, ...retainedIds]
    );
  }
}
