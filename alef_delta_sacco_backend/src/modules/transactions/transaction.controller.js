import httpError from '../../core/utils/httpError.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import { deposit, withdraw, getTransactions, getMemberTransactions, updateTransactionReceiptPhoto } from './transaction.service.js';
import { moneyMovementSchema, transactionQuerySchema } from './transaction.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleDeposit(req, res, next) {
  try {
    // Handle FormData (multipart) or JSON
    let body = req.body;
    if (req.is('multipart/form-data')) {
      // For FormData, convert string numbers to numbers
      body = {
        account_id: body.account_id,
        amount: body.amount ? (typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount) : undefined,
        reference: body.reference || ''
      };
    }
    
    const payload = validate(moneyMovementSchema, body);
    
    if (!payload.account_id) {
      throw httpError(400, 'account_id is required');
    }
    
    const receiptPhotoUrl = req.file ? toPublicUrl(req.file.path) : null;
    const txn = await deposit({
      accountId: payload.account_id,
      amount: payload.amount,
      reference: payload.reference || '',
      receiptPhotoUrl,
      performedBy: req.user?.userId || 'SYSTEM',
      idempotencyKey: req.idempotency?.key
    });
    const response = { idempotency_key: req.idempotency?.key, transaction: txn };
    if (req.idempotency) {
      await req.idempotency.save(201, response);
    }
    res.status(201).json(response);
  } catch (error) {
    console.error('Deposit error:', error);
    next(error);
  }
}

export async function handleWithdraw(req, res, next) {
  try {
    // Handle FormData (multipart) or JSON
    let body = req.body;
    if (req.is('multipart/form-data')) {
      // For FormData, convert string numbers to numbers
      body = {
        account_id: body.account_id,
        amount: body.amount ? (typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount) : undefined,
        reference: body.reference || ''
      };
    }
    
    const payload = validate(moneyMovementSchema, body);
    
    if (!payload.account_id) {
      throw httpError(400, 'account_id is required');
    }
    
    const receiptPhotoUrl = req.file ? toPublicUrl(req.file.path) : null;
    const txn = await withdraw({
      accountId: payload.account_id,
      amount: payload.amount,
      reference: payload.reference || '',
      receiptPhotoUrl,
      performedBy: req.user?.userId || 'SYSTEM',
      idempotencyKey: req.idempotency?.key
    });
    const response = { idempotency_key: req.idempotency?.key, transaction: txn };
    if (req.idempotency) {
      await req.idempotency.save(201, response);
    }
    res.status(201).json(response);
  } catch (error) {
    console.error('Withdraw error:', error);
    next(error);
  }
}

export async function handleGetTransactions(req, res, next) {
  try {
    const { limit = 50, offset = 0, txn_type, product_code, date_from, date_to, search } = req.query;
    const filters = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    // Only add filters if they have values
    if (txn_type && txn_type !== 'ALL') filters.txn_type = txn_type;
    if (product_code && product_code !== 'ALL') filters.product_code = product_code;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;
    if (search && search.trim()) filters.search = search.trim();
    
    const rows = await getTransactions(filters);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMemberTransactions(req, res, next) {
  try {
    const { memberId } = req.params;
    const { limit = 50, offset = 0, txn_type, date_from, date_to } = req.query;
    
    if (!memberId) {
      return res.status(400).json({ message: 'Member ID is required' });
    }
    
    const transactions = await getMemberTransactions(memberId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      txn_type,
      date_from,
      date_to
    });
    res.json({ data: transactions });
  } catch (error) {
    console.error('Error in handleGetMemberTransactions:', error);
    next(error);
  }
}

export async function handleUpdateTransactionReceipt(req, res, next) {
  try {
    const { txnId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Receipt photo is required' });
    }
    
    const receiptPhotoUrl = toPublicUrl(req.file.path);
    const transaction = await updateTransactionReceiptPhoto(txnId, receiptPhotoUrl);
    
    res.json({ data: transaction });
  } catch (error) {
    console.error('Error in handleUpdateTransactionReceipt:', error);
    next(error);
  }
}

