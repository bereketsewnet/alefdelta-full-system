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
  
  return createAccountProductRepo(payload);
}

export async function updateAccountProduct(productCode, payload) {
  const product = await findAccountProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Account product not found');
  }
  
  return updateAccountProductRepo(productCode, payload);
}

export async function deleteAccountProduct(productCode) {
  const product = await findAccountProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Account product not found');
  }
  
  return deleteAccountProductRepo(productCode);
}

