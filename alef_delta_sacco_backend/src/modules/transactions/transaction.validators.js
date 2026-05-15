import Joi from 'joi';

export const moneyMovementSchema = Joi.object({
  account_id: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reference: Joi.string().allow('', null)
});

export const transactionQuerySchema = Joi.object({
  account_id: Joi.string().optional(),
  txn_type: Joi.string().valid('DEPOSIT', 'WITHDRAWAL').optional(),
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

