import httpError from '../../core/utils/httpError.js';
import { createAccountSchema, updateAccountSchema } from './account.validators.js';
import {
  getAccounts,
  getAccountById,
  getAccountsForMember,
  createAccount,
  updateAccount,
  closeAccount,
  freezeAccount,
  unfreezeAccount,
  deleteAccount
} from './account.service.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListAccounts(req, res, next) {
  try {
    const result = await getAccounts({
      member_id: req.query.member_id,
      status: req.query.status,
      product_code: req.query.product_code,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetAccount(req, res, next) {
  try {
    const account = await getAccountById(req.params.id);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function handleGetMemberAccounts(req, res, next) {
  try {
    if (!req.params.memberId) {
      throw httpError(400, 'memberId is required');
    }
    const accounts = await getAccountsForMember(req.params.memberId);
    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateAccount(req, res, next) {
  try {
    const payload = validate(createAccountSchema, req.body);
    const account = await createAccount(payload);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateAccount(req, res, next) {
  try {
    const payload = validate(updateAccountSchema, req.body);
    const account = await updateAccount(req.params.id, payload);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function handleCloseAccount(req, res, next) {
  try {
    const account = await closeAccount(req.params.id);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function handleFreezeAccount(req, res, next) {
  try {
    const account = await freezeAccount(req.params.id);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function handleUnfreezeAccount(req, res, next) {
  try {
    const account = await unfreezeAccount(req.params.id);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteAccount(req, res, next) {
  try {
    const result = await deleteAccount(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
