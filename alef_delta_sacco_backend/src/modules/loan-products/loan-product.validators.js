import Joi from 'joi';

const tierFields = {
  loan_category: Joi.string().valid('STANDARD', 'VEHICLE', 'HOUSING').allow(null, ''),
  min_savings_duration_months: Joi.number().integer().min(0).allow(null),
  loan_amount_min_etb: Joi.number().min(0).allow(null),
  loan_amount_max_etb: Joi.number().min(0).allow(null),
  required_pre_savings_pct: Joi.number().min(0).max(100).allow(null),
  eligible_savings_types: Joi.string().allow(null, '').max(255),
  requires_lump_sum_pre_savings: Joi.boolean().default(false)
};

export const createLoanProductSchema = Joi.object({
  product_code: Joi.string().required().max(30),
  name: Joi.string().required().max(150),
  interest_rate: Joi.number().min(0).max(100).required(),
  interest_type: Joi.string().valid('FLAT', 'DECLINING').required(),
  min_term_months: Joi.number().integer().min(1).required(),
  max_term_months: Joi.number().integer().min(1).required(),
  penalty_rate: Joi.number().min(0).max(100).default(0),
  category: Joi.string().max(50).allow(null, ''),
  ...tierFields
});

export const updateLoanProductSchema = Joi.object({
  name: Joi.string().max(150),
  interest_rate: Joi.number().min(0).max(100),
  interest_type: Joi.string().valid('FLAT', 'DECLINING'),
  min_term_months: Joi.number().integer().min(1),
  max_term_months: Joi.number().integer().min(1),
  penalty_rate: Joi.number().min(0).max(100),
  category: Joi.string().max(50).allow(null, ''),
  ...tierFields
});

