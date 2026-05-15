import Joi from 'joi';

export const loginSchema = Joi.object({
  actor: Joi.string().valid('STAFF', 'MEMBER').default('STAFF'),
  identifier: Joi.string().required(),
  password: Joi.string().min(6).required()
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const otpRequestSchema = Joi.object({
  phone: Joi.string().required()
});

export const otpVerifySchema = Joi.object({
  otp_request_id: Joi.string().uuid().required(),
  code: Joi.string().length(6).required(),
  new_password: Joi.string().min(6).required()
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
});

