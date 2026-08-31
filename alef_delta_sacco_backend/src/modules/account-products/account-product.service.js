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
  
  return deleteAccountProductRepo(productCode);
}
