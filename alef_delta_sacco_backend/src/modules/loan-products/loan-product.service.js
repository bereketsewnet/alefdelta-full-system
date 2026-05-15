import httpError from '../../core/utils/httpError.js';
import {
  listLoanProducts,
  findLoanProductByCode,
  createLoanProduct as createLoanProductRepo,
  updateLoanProduct as updateLoanProductRepo,
  deleteLoanProduct as deleteLoanProductRepo
} from './loan-product.repository.js';

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
  
  return createLoanProductRepo(payload);
}

export async function updateLoanProduct(productCode, payload) {
  const product = await findLoanProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Loan product not found');
  }
  
  return updateLoanProductRepo(productCode, payload);
}

export async function deleteLoanProduct(productCode) {
  const product = await findLoanProductByCode(productCode);
  if (!product) {
    throw httpError(404, 'Loan product not found');
  }
  
  return deleteLoanProductRepo(productCode);
}

