import httpError from '../../core/utils/httpError.js';
import { removeFile, toPublicUrl } from '../../core/utils/fileStorage.js';
import {
  approveSharePurchaseRequest,
  createSharePurchaseRequest,
  getMemberShareEntries,
  getMemberShareSummary,
  listSharePurchaseRequests,
  purchaseShares,
  quoteShareTransaction,
  redeemShares,
  rejectSharePurchaseRequest
} from './share.service.js';

function file(req, field) {
  return req.files?.[field]?.[0] || (req.file?.fieldname === field ? req.file : null);
}

function proof(req) {
  const company = file(req, 'company_receipt') || file(req, 'receipt');
  const bank = file(req, 'bank_receipt');
  return {
    receiptPhotoUrl: company ? toPublicUrl(company.path) : null,
    bankReceiptPhotoUrl: bank ? toPublicUrl(bank.path) : null
  };
}

function uploadedProofs(req) {
  return ['company_receipt', 'receipt', 'bank_receipt'].map((field) => file(req, field)).filter(Boolean);
}

async function removeUploadedProofs(req) {
  await Promise.allSettled(uploadedProofs(req).map((item) => removeFile(item.path)));
}

function assertReceiptImages(req) {
  const invalid = uploadedProofs(req).find((item) => !String(item.mimetype || '').toLowerCase().startsWith('image/'));
  if (invalid) throw httpError(400, 'Receipt proof must be an image (JPG, PNG, GIF or WebP)');
}

function postingPayload(req) {
  const files = proof(req);
  return {
    accountId: req.body.account_id,
    amount: req.body.amount,
    reference: req.body.reference,
    bankReceiptNo: req.body.bank_receipt_no,
    remark: req.body.remark,
    ...files,
    performedBy: req.user.userId,
    idempotencyKey: req.idempotency?.key
  };
}

export async function handleMemberSummary(req, res, next) {
  try { res.json({ data: await getMemberShareSummary(req.params.memberId) }); } catch (error) { next(error); }
}

export async function handleMemberEntries(req, res, next) {
  try { res.json({ data: await getMemberShareEntries(req.params.memberId, req.query) }); } catch (error) { next(error); }
}

export async function handleQuote(req, res, next) {
  try {
    const { member_id: memberId, account_id: accountId, action, amount } = req.body;
    if (!accountId && !memberId) throw httpError(400, 'member_id or account_id is required');
    res.json({ data: await quoteShareTransaction({ memberId, accountId, action, amount }) });
  } catch (error) { next(error); }
}

export async function handlePurchase(req, res, next) {
  let posted = false;
  try {
    assertReceiptImages(req);
    const result = await purchaseShares(postingPayload(req));
    posted = true;
    if (result.idempotent_replay) await removeUploadedProofs(req);
    const response = { idempotency_key: req.idempotency?.key, data: result };
    if (req.idempotency) await req.idempotency.save(201, response);
    res.status(201).json(response);
  } catch (error) {
    if (!posted) await removeUploadedProofs(req);
    next(error);
  }
}

export async function handleRedemption(req, res, next) {
  let posted = false;
  try {
    assertReceiptImages(req);
    const result = await redeemShares(postingPayload(req));
    posted = true;
    if (result.idempotent_replay) await removeUploadedProofs(req);
    const response = { idempotency_key: req.idempotency?.key, data: result };
    if (req.idempotency) await req.idempotency.save(201, response);
    res.status(201).json(response);
  } catch (error) {
    if (!posted) await removeUploadedProofs(req);
    next(error);
  }
}

export async function handleListRequests(req, res, next) {
  try { res.json({ data: await listSharePurchaseRequests({ status: req.query.status }) }); } catch (error) { next(error); }
}

export async function handleApproveRequest(req, res, next) {
  try { res.json({ data: await approveSharePurchaseRequest(req.params.requestId, req.user.userId) }); } catch (error) { next(error); }
}

export async function handleRejectRequest(req, res, next) {
  try { res.json({ data: await rejectSharePurchaseRequest(req.params.requestId, req.user.userId, req.body.reason) }); } catch (error) { next(error); }
}

export async function handleMySummary(req, res, next) {
  try { res.json({ data: await getMemberShareSummary(req.user.memberId) }); } catch (error) { next(error); }
}

export async function handleMyPurchaseQuote(req, res, next) {
  try {
    res.json({ data: await quoteShareTransaction({ memberId: req.user.memberId, action: 'PURCHASE', amount: req.body.amount }) });
  } catch (error) { next(error); }
}

export async function handleMyEntries(req, res, next) {
  try { res.json({ data: await getMemberShareEntries(req.user.memberId, req.query) }); } catch (error) { next(error); }
}

export async function handleCreateMyRequest(req, res, next) {
  try {
    const receipt = req.file;
    assertReceiptImages(req);
    const result = await createSharePurchaseRequest(req.user.memberId, {
      amount: req.body.amount,
      referenceNumber: req.body.reference_number,
      receiptPhotoUrl: receipt ? toPublicUrl(receipt.path) : null,
      description: req.body.description
    });
    res.status(201).json({ data: result });
  } catch (error) {
    await removeUploadedProofs(req);
    next(error);
  }
}

export async function handleMyRequests(req, res, next) {
  try { res.json({ data: await listSharePurchaseRequests({ memberId: req.user.memberId, status: req.query.status }) }); } catch (error) { next(error); }
}
