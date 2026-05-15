import httpError from '../../core/utils/httpError.js';
import {
  getLoanProducts,
  getLoanProductByCode,
  createLoanProduct,
  updateLoanProduct,
  deleteLoanProduct
} from './loan-product.service.js';
import { createLoanProductSchema, updateLoanProductSchema } from './loan-product.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListLoanProducts(req, res, next) {
  try {
    const products = await getLoanProducts();
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLoanProduct(req, res, next) {
  try {
    const product = await getLoanProductByCode(req.params.code);
    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateLoanProduct(req, res, next) {
  try {
    const payload = validate(createLoanProductSchema, req.body);
    const product = await createLoanProduct(payload);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateLoanProduct(req, res, next) {
  try {
    const payload = validate(updateLoanProductSchema, req.body);
    const product = await updateLoanProduct(req.params.code, payload);
    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteLoanProduct(req, res, next) {
  try {
    await deleteLoanProduct(req.params.code);
    res.json({ message: 'Loan product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

