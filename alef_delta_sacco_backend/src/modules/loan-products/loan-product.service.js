import httpError from '../../core/utils/httpError.js';
import { v4 as uuid } from 'uuid';
import { withTransaction } from '../../core/db.js';
import { replaceProductTiers } from './loan-tier.repository.js';
import {
  listLoanProducts,
  findLoanProductByCode,
  createLoanProduct as createLoanProductRepo,
  updateLoanProduct as updateLoanProductRepo,
  deleteLoanProduct as deleteLoanProductRepo
} from './loan-product.repository.js';

function normalizeTiers(tiers) {
  const seen = new Set();
  return tiers.map((tier, index) => {
    const code = tier.tier_code.trim().toUpperCase();
    if (seen.has(code)) throw httpError(400, `Duplicate tier code: ${code}`);
    seen.add(code);
    return { ...tier, tier_id: tier.tier_id || uuid(), tier_code: code, display_order: tier.display_order ?? index + 1 };
  });
}

async function validateEligibleSavingsProducts(tiers, connection) {
  const codes = [...new Set(tiers.flatMap((tier) => tier.eligible_savings_products))];
  if (!codes.length) throw httpError(400, 'Every tier must select at least one compulsory savings product');
  const placeholders = codes.map(() => '?').join(',');
  const [rows] = await connection.query(
    `SELECT product_code FROM account_products
     WHERE product_code IN (${placeholders}) AND is_active = 1 AND financial_category = 'COMPULSORY_SAVINGS'`,
    codes
  );
  const valid = new Set(rows.map((row) => row.product_code));
  const invalid = codes.filter((code) => !valid.has(code));
  if (invalid.length) {
    throw httpError(400, `Only active compulsory savings products are eligible: ${invalid.join(', ')}`);
  }
}

export async function getLoanProducts() {
  return listLoanProducts();
}

export async function getLoanProductByCode(productCode) {
  const product = await findLoanProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Loan product not found');
  }
  return product;
}

export async function createLoanProduct(payload) {
  // Check if product code already exists
  const existing = await findLoanProductByCode(payload.product_code);
  if (existing) {
    throw httpError(400, `Loan product with code ${payload.product_code} already exists`);
  }
  
  const tiers = normalizeTiers(payload.tiers);
  return withTransaction(async (connection) => {
    await validateEligibleSavingsProducts(tiers, connection);
    await createLoanProductRepo(payload, connection);
    await replaceProductTiers(payload.product_code, tiers, connection);
    return findLoanProductByCode(payload.product_code, connection);
  });
}

export async function updateLoanProduct(productCode, payload) {
  const product = await findLoanProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Loan product not found');
  }
  
  return withTransaction(async (connection) => {
    await updateLoanProductRepo(productCode, payload, connection);
    if (payload.tiers) {
      const tiers = normalizeTiers(payload.tiers);
      await validateEligibleSavingsProducts(tiers, connection);
      await replaceProductTiers(productCode, tiers, connection);
    }
    return findLoanProductByCode(productCode, connection);
  });
}

export async function deleteLoanProduct(productCode) {
  const product = await findLoanProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Loan product not found');
  }
  
  return deleteLoanProductRepo(productCode);
}
