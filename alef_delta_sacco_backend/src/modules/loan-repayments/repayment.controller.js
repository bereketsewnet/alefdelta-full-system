import {
  processLoanRepayment,
  getLoanPaymentSummary,
  getLoanRepaymentHistory,
  getMemberRepayments,
  checkPenaltyAndNotify,
  updateLoanRepaymentReceiptInfo
  , adjustLoanPenalty, listLoanPenaltyAdjustments
} from './repayment.service.js';
import { repaymentSchema } from './repayment.validators.js';
import httpError from '../../core/utils/httpError.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleMakePayment(req, res, next) {
  try {
    const payload = validate(repaymentSchema, req.body);
    const result = await processLoanRepayment(
      req.params.loanId,
      payload,
      req.files || {},
      req.user
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetPaymentSummary(req, res, next) {
  try {
    const summary = await getLoanPaymentSummary(req.params.loanId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function handleGetRepaymentHistory(req, res, next) {
  try {
    const history = await getLoanRepaymentHistory(req.params.loanId);
    res.json({ data: history });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMemberRepayments(req, res, next) {
  try {
    const repayments = await getMemberRepayments(req.params.memberId);
    res.json({ data: repayments });
  } catch (error) {
    next(error);
  }
}

export async function handleCheckAndNotifyPenalty(req, res, next) {
  try {
    const result = await checkPenaltyAndNotify(req.params.loanId, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateRepaymentReceipt(req, res, next) {
  try {
    const repaymentId = req.params.repaymentId;
    const payload = {
      bank_receipt_no: req.body.bank_receipt_no,
      company_receipt_no: req.body.company_receipt_no,
    };
    const updated = await updateLoanRepaymentReceiptInfo(
      repaymentId,
      payload,
      req.files || {},
      req.user
    );
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function handleAdjustPenalty(req, res, next) {
  try { res.json(await adjustLoanPenalty(req.params.loanId, req.body, req.user)); } catch (error) { next(error); }
}
export async function handleListPenaltyAdjustments(req, res, next) {
  try { res.json({ data: await listLoanPenaltyAdjustments(req.params.loanId) }); } catch (error) { next(error); }
}
