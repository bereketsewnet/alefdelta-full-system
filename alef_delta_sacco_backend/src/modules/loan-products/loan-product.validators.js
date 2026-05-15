import Joi from 'joi';

export const createLoanProductSchema = Joi.object({
  product_code: Joi.string().required().max(30),
  name: Joi.string().required().max(150),
  interest_rate: Joi.number().min(0).max(100).required(),
  interest_type: Joi.string().valid('FLAT', 'DECLINING').required(),
  min_term_months: Joi.number().integer().min(1).required(),
  max_term_months: Joi.number().integer().min(1).required(),
  penalty_rate: Joi.number().min(0).max(100).default(0),
  category: Joi.string().max(50).allow(null, '')
});

export const updateLoanProductSchema = Joi.object({
  name: Joi.string().max(150),
  interest_rate: Joi.number().min(0).max(100),
  interest_type: Joi.string().valid('FLAT', 'DECLINING'),
  min_term_months: Joi.number().integer().min(1),
  max_term_months: Joi.number().integer().min(1),
  penalty_rate: Joi.number().min(0).max(100),
  category: Joi.string().max(50).allow(null, '')
});

