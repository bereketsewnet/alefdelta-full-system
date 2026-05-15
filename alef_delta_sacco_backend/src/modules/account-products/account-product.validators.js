import Joi from 'joi';

export const createAccountProductSchema = Joi.object({
  product_code: Joi.string().required().max(30),
  name: Joi.string().required().max(150),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(50).allow(null, ''),
  product_kind: Joi.string().valid('STANDARD', 'CHILDREN', 'IN_KIND', 'MICRO').default('STANDARD'),
  is_active: Joi.boolean().default(true),
  guardian_required: Joi.boolean().default(false),
  commodity_required: Joi.boolean().default(false),
  target_required: Joi.boolean().default(false),
  default_commodity_type: Joi.string().max(120).allow(null, ''),
  min_balance: Joi.number().min(0).default(0),
  min_deposit: Joi.number().min(0).default(0),
  interest_rate: Joi.number().min(0).max(100).default(0),
  withdrawal_policy: Joi.string().allow(null, ''),
  metadata_schema: Joi.string().allow(null, ''),
  notes: Joi.string().allow(null, '')
});

export const updateAccountProductSchema = Joi.object({
  name: Joi.string().max(150),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(50).allow(null, ''),
  product_kind: Joi.string().valid('STANDARD', 'CHILDREN', 'IN_KIND', 'MICRO'),
  is_active: Joi.boolean(),
  guardian_required: Joi.boolean(),
  commodity_required: Joi.boolean(),
  target_required: Joi.boolean(),
  default_commodity_type: Joi.string().max(120).allow(null, ''),
  min_balance: Joi.number().min(0),
  min_deposit: Joi.number().min(0),
  interest_rate: Joi.number().min(0).max(100),
  withdrawal_policy: Joi.string().allow(null, ''),
  metadata_schema: Joi.string().allow(null, ''),
  notes: Joi.string().allow(null, '')
}).min(1);

