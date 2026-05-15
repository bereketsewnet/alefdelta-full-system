import httpError from '../../core/utils/httpError.js';
import {
  getAccountProducts,
  getAccountProductByCode,
  createAccountProduct,
  updateAccountProduct,
  deleteAccountProduct
} from './account-product.service.js';
import { createAccountProductSchema, updateAccountProductSchema } from './account-product.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListAccountProducts(req, res, next) {
  try {
    const products = await getAccountProducts();
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
}

export async function handleGetAccountProduct(req, res, next) {
  try {
    const product = await getAccountProductByCode(req.params.code);
    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateAccountProduct(req, res, next) {
  try {
    const payload = validate(createAccountProductSchema, req.body);
    const product = await createAccountProduct(payload);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateAccountProduct(req, res, next) {
  try {
    const payload = validate(updateAccountProductSchema, req.body);
    const product = await updateAccountProduct(req.params.code, payload);
    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteAccountProduct(req, res, next) {
  try {
    await deleteAccountProduct(req.params.code);
    res.json({ message: 'Account product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

