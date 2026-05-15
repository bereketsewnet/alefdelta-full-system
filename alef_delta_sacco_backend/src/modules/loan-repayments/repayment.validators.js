import Joi from 'joi';

export const repaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  payment_method: Joi.string().valid('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK').default('CASH'),
  // New fields
  bank_receipt_no: Joi.string().allow(null, '').optional(),
  company_receipt_no: Joi.string().allow(null, '').optional(),
  // Backwards compatibility (old single receipt fields)
  receipt_no: Joi.string().allow(null, '').optional(),
  notes: Joi.string().allow(null, '').optional(),
  idempotency_key: Joi.string().allow(null, '').optional()
});


