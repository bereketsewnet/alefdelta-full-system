import Joi from 'joi';

export const createMemberSchema = Joi.object({
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow(null, ''),
  last_name: Joi.string().required(),
  phone_primary: Joi.string().required(),
  email: Joi.string().email().allow(null, ''),
  // Accept both M/F and MALE/FEMALE/OTHER formats
  gender: Joi.string().valid('M', 'F', 'MALE', 'FEMALE', 'OTHER').required(),
  marital_status: Joi.string().valid('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED').required(),
  age: Joi.number().integer().min(18).max(120).allow(null),
  family_size_female: Joi.number().integer().min(0).default(0),
  family_size_male: Joi.number().integer().min(0).default(0),
  educational_level: Joi.string().valid('PRIMARY', 'SECONDARY', 'DIPLOMA', 'DEGREE', 'MASTERS', 'PHD', 'NONE').allow(null, ''),
  occupation: Joi.string().max(200).allow(null, ''),
  work_experience_years: Joi.number().integer().min(0).allow(null),
  address_subcity: Joi.string().allow(null, ''),
  address_woreda: Joi.string().allow(null, ''),
  address_kebele: Joi.string().max(100).allow(null, ''),
  address_area_name: Joi.string().max(200).allow(null, ''),
  address_house_no: Joi.string().allow(null, ''),
  national_id_number: Joi.string().max(50).allow(null, ''),
  shares_requested: Joi.number().integer().min(0).default(0),
  terms_accepted: Joi.boolean().valid(true).required(),
  terms_accepted_at: Joi.date().allow(null),
  // Accept frontend values and map to backend values
  member_type: Joi.string().valid('INDIVIDUAL', 'GOV_EMP', 'NGO', 'SME', 'TRADER', 'FARMER', 'SELF').required(),
  monthly_income: Joi.number().min(0).required(),
  tin_number: Joi.string().allow(null, ''),
  status: Joi.string().valid('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED').default('PENDING'),
  password: Joi.string().min(6).required(), // Changed from 8 to 6 to match frontend
  // ID card URLs (separate from documents)
  id_card_front_url: Joi.string().allow(null, '').optional(),
  id_card_back_url: Joi.string().allow(null, '').optional()
});

export const updateMemberSchema = createMemberSchema.fork(
  Object.keys(createMemberSchema.describe().keys),
  (schema) => schema.optional()
).keys({
  password: Joi.string().min(6).optional().allow(null, '') // Allow password update but make it optional
});

export const beneficiarySchema = Joi.object({
  full_name: Joi.string().required(),
  relationship: Joi.string().required(),
  phone: Joi.string().required()
});

export const emergencyContactSchema = Joi.object({
  full_name: Joi.string().required(),
  subcity: Joi.string().allow(null, ''),
  woreda: Joi.string().allow(null, ''),
  kebele: Joi.string().allow(null, ''),
  house_number: Joi.string().allow(null, ''),
  phone_number: Joi.string().required(),
  relationship: Joi.string().allow(null, '')
});

export const resetMemberPasswordSchema = Joi.object({
  new_password: Joi.string().min(6).required()
});

