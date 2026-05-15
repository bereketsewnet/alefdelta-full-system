import Joi from 'joi';

export const createAccountSchema = Joi.object({
  member_id: Joi.string().required(),
  product_code: Joi.string().required(),
  currency: Joi.string().default('ETB'),
  metadata: Joi.object().unknown(true).allow(null)
});

export const updateAccountSchema = Joi.object({
  product_code: Joi.string().max(30), // Validate against database in service
  currency: Joi.string().valid('ETB', 'USD'),
  status: Joi.string().valid('ACTIVE', 'FROZEN', 'CLOSED'),
  lien_amount: Joi.number().min(0),
  metadata: Joi.object().unknown(true).allow(null)
}).min(1);

