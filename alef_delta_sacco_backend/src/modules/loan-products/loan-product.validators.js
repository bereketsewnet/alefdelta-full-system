import Joi from 'joi';

const tierFields = {
  loan_category: Joi.string().valid('STANDARD', 'VEHICLE', 'HOUSING').allow(null, ''),
  min_savings_duration_months: Joi.number().integer().min(0).allow(null),
  loan_amount_min_etb: Joi.number().min(0).allow(null),
  loan_amount_max_etb: Joi.number().min(0).allow(null),
  required_pre_savings_pct: Joi.number().min(0).max(100).allow(null),
  required_share_purchase_pct: Joi.number().min(0).max(100).allow(null),
  eligible_savings_types: Joi.string().allow(null, '').max(255),
  requires_lump_sum_pre_savings: Joi.boolean().default(false)
};

const loanTierSchema = Joi.object({
  // Existing compatibility tiers were seeded with MySQL UUID() (UUID v1),
  // while newly created tiers use UUID v4. Both are valid persistent IDs.
  tier_id: Joi.string().guid().optional(),
  tier_code: Joi.string().trim().uppercase().max(30).required(),
  name: Joi.string().trim().max(150).required(),
  display_order: Joi.number().integer().min(0).optional(),
  min_savings_duration_months: Joi.number().integer().min(0).required(),
  loan_amount_min_etb: Joi.number().min(0).required(),
  loan_amount_max_etb: Joi.number().positive().allow(null).required(),
  max_term_months: Joi.number().integer().min(1).required(),
  interest_rate: Joi.number().min(0).max(100).required(),
  required_pre_savings_pct: Joi.number().min(0).max(100).required(),
  required_share_purchase_pct: Joi.number().min(0).max(100).required(),
  eligible_savings_products: Joi.array().items(Joi.string().trim().max(30)).min(1).required()
}).custom((tier, helpers) => {
  if (tier.loan_amount_max_etb != null && tier.loan_amount_max_etb < tier.loan_amount_min_etb) {
    return helpers.error('any.custom', { message: 'Tier maximum amount must be greater than or equal to its minimum amount' });
  }
  return tier;
});

export const createLoanProductSchema = Joi.object({
  product_code: Joi.string().required().max(30),
  name: Joi.string().required().max(150),
  interest_rate: Joi.number().min(0).max(100).required(),
  interest_type: Joi.string().valid('FLAT', 'DECLINING').required(),
  min_term_months: Joi.number().integer().min(1).required(),
  max_term_months: Joi.number().integer().min(1).required(),
  penalty_rate: Joi.number().min(0).max(100).default(0),
  penalty_mode: Joi.string().valid('PERCENT', 'FIXED').default('PERCENT'), penalty_fixed_amount: Joi.number().min(0).default(0), penalty_grace_days: Joi.number().integer().min(0).default(0), penalty_escalation_enabled: Joi.boolean().default(false), penalty_escalation_value: Joi.number().min(0).default(0),
  service_charge_mode: Joi.string().valid('PERCENT', 'FIXED').default('PERCENT'), service_charge_rate: Joi.number().min(0).max(100).default(0), service_charge_fixed_amount: Joi.number().min(0).default(0),
  category: Joi.string().max(50).allow(null, ''),
  tiers: Joi.array().items(loanTierSchema).min(1).required(),
  ...tierFields
});

export const updateLoanProductSchema = Joi.object({
  name: Joi.string().max(150),
  interest_rate: Joi.number().min(0).max(100),
  interest_type: Joi.string().valid('FLAT', 'DECLINING'),
  min_term_months: Joi.number().integer().min(1),
  max_term_months: Joi.number().integer().min(1),
  penalty_rate: Joi.number().min(0).max(100),
  penalty_mode: Joi.string().valid('PERCENT', 'FIXED'), penalty_fixed_amount: Joi.number().min(0), penalty_grace_days: Joi.number().integer().min(0), penalty_escalation_enabled: Joi.boolean(), penalty_escalation_value: Joi.number().min(0),
  service_charge_mode: Joi.string().valid('PERCENT', 'FIXED'), service_charge_rate: Joi.number().min(0).max(100), service_charge_fixed_amount: Joi.number().min(0),
  category: Joi.string().max(50).allow(null, ''),
  tiers: Joi.array().items(loanTierSchema).min(1),
  ...tierFields
});
