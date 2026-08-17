import Joi from 'joi';

export const createLoanSchema = Joi.object({
  member_id: Joi.string().required(),
  product_code: Joi.string().required(),
  selected_tier_id: Joi.string().guid().required(),
  applied_amount: Joi.number().positive().required(),
  term_months: Joi.number().integer().min(1).required(),
  interest_rate: Joi.number().positive().optional(),
  interest_type: Joi.string().valid('DECLINING').optional(),
  purpose_description: Joi.string().required(),
  borrower_age: Joi.number().integer().min(18).max(120).optional(),
  repayment_frequency: Joi.string().valid('MONTHLY', 'WEEKLY', 'QUARTERLY').default('MONTHLY')
  , exception_reason: Joi.string().trim().min(10).max(2000).allow(null, '').optional()
});

export const approveLoanSchema = Joi.object({
  approved_amount: Joi.number().positive().required(),
  term_months: Joi.number().integer().min(1).required(),
  interest_rate: Joi.number().positive().required(),
  disbursement_date: Joi.string().optional(),
  audit_note: Joi.string().min(3).required(),
  lien_account_id: Joi.string().allow(null, ''),
  lien_amount: Joi.number().min(0).allow(null)
  , override_acknowledged: Joi.boolean().default(false)
  , override_reason: Joi.string().trim().min(10).max(2000).allow(null, '').optional()
});

export const installmentSchema = Joi.object({
  principal: Joi.number().positive().required(),
  interestRate: Joi.number().positive().required(),
  interestType: Joi.string().valid('DECLINING').required(),
  termMonths: Joi.number().integer().min(1).required()
});

export const guarantorSchema = Joi.object({
  full_name: Joi.string().required(),
  phone: Joi.string().required(),
  age: Joi.number().integer().min(18).max(120).required(),
  relationship: Joi.string().allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  guaranteed_amount: Joi.number().positive().optional(),
  duty_value: Joi.number().positive().allow(null, '').optional()
});

export const collateralSchema = Joi.object({
  type: Joi.string().valid('LAND', 'VEHICLE', 'CASH', 'OTHER').required(),
  description: Joi.string().required(),
  estimated_value: Joi.number().positive().required()
});

export const checkEligibilitySchema = Joi.object({
  member_id: Joi.string().required(),
  product_code: Joi.string().required(),
  selected_tier_id: Joi.string().guid().required(),
  applied_amount: Joi.number().positive().required(),
  term_months: Joi.number().integer().min(1).required(),
  interest_rate: Joi.number().positive().optional(),
  interest_type: Joi.string().valid('DECLINING').optional(),
  borrower_age: Joi.number().integer().min(18).max(120).optional()
});

export const updateLoanStatusSchema = Joi.object({
  workflow_status: Joi.string().valid('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED').required(),
  reason: Joi.string().min(3).when('workflow_status', { is: 'REJECTED', then: Joi.required(), otherwise: Joi.optional() })
});
