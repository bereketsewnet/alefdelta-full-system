import httpError from '../../core/utils/httpError.js';
import {
  listAccountProducts,
  findAccountProductByCode,
  createAccountProduct as createAccountProductRepo,
  updateAccountProduct as updateAccountProductRepo,
  deleteAccountProduct as deleteAccountProductRepo
} from './account-product.repository.js';

export async function getAccountProducts() {
  return listAccountProducts();
}

export async function getAccountProductByCode(productCode) {
  const product = await findAccountProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Account product not found');
  }
  return product;
}

export async function createAccountProduct(payload) {
  // Check if product code already exists
  const existing = await findAccountProductByCode(payload.product_code);
  if (existing) {
    throw httpError(400, `Account product with code ${payload.product_code} already exists`);
  }
  const normalized = { ...payload };
  if (normalized.product_code === 'SHR_CAP') {
    normalized.financial_category = 'SHARE_CAPITAL';
    normalized.interest_method = 'PROFIT_SHARING';
    normalized.interest_rate = 0;
    normalized.is_active = true;
  } else if (normalized.financial_category === 'SHARE_CAPITAL') {
    throw httpError(400, 'SHR_CAP is the single supported Share Capital product; do not create a second share product');
  }
  if (normalized.interest_method === 'PROFIT_SHARING') normalized.interest_rate = 0;
  if (normalized.interest_method === 'STANDARD' && Number(normalized.interest_rate) <= 0) throw httpError(400, 'Regular Interest requires a percentage greater than zero');
  return createAccountProductRepo(normalized);
}

export async function updateAccountProduct(productCode, payload) {
  const product = await findAccountProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Account product not found');
  }
  
  const normalized = { ...payload };
  if (productCode === 'SHR_CAP') {
    if (normalized.financial_category !== undefined && normalized.financial_category !== 'SHARE_CAPITAL') {
      throw httpError(400, 'SHR_CAP must remain categorized as Share Capital');
    }
    if (normalized.interest_method !== undefined && normalized.interest_method !== 'PROFIT_SHARING') {
      throw httpError(400, 'SHR_CAP cannot receive regular monthly savings interest');
    }
    if (normalized.is_active === false) {
      throw httpError(400, 'SHR_CAP must remain active so every member has one Share Capital account');
    }
    normalized.financial_category = 'SHARE_CAPITAL';
    normalized.interest_method = 'PROFIT_SHARING';
    normalized.interest_rate = 0;
  } else if (normalized.financial_category === 'SHARE_CAPITAL') {
    throw httpError(400, 'SHR_CAP is the single supported Share Capital product');
  }
  const resultingMethod = normalized.interest_method ?? product.interest_method;
  if (resultingMethod === 'PROFIT_SHARING') normalized.interest_rate = 0;
  const resultingRate = normalized.interest_rate ?? product.interest_rate;
  if (resultingMethod === 'STANDARD' && Number(resultingRate) <= 0) throw httpError(400, 'Regular Interest requires a percentage greater than zero');
  return updateAccountProductRepo(productCode, normalized);
}

export async function deleteAccountProduct(productCode) {
  const product = await findAccountProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Account product not found');
  }
  if (productCode === 'SHR_CAP') throw httpError(400, 'The core SHR_CAP Share Capital product cannot be deleted');
  
  return deleteAccountProductRepo(productCode);
}
