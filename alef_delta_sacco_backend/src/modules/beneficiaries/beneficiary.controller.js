import httpError from '../../core/utils/httpError.js';
import Joi from 'joi';
import {
  getBeneficiariesForMember,
  getBeneficiaryById,
  createNewBeneficiary,
  updateExistingBeneficiary,
  removeBeneficiary
} from './beneficiary.service.js';

const beneficiarySchema = Joi.object({
  full_name: Joi.string().required(),
  relationship: Joi.string().required(),
  phone: Joi.string().required()
});

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListBeneficiaries(req, res, next) {
  try {
    const beneficiaries = await getBeneficiariesForMember(req.params.memberId);
    res.json({ data: beneficiaries });
  } catch (error) {
    next(error);
  }
}

export async function handleGetBeneficiary(req, res, next) {
  try {
    const beneficiary = await getBeneficiaryById(req.params.beneficiaryId);
    res.json(beneficiary);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateBeneficiary(req, res, next) {
  try {
    const payload = validate(beneficiarySchema, req.body);
    const beneficiary = await createNewBeneficiary(req.params.memberId, payload, req.files || {});
    res.status(201).json(beneficiary);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateBeneficiary(req, res, next) {
  try {
    const payload = validate(beneficiarySchema.fork(Object.keys(beneficiarySchema.describe().keys), (schema) => schema.optional()), req.body);
    const beneficiary = await updateExistingBeneficiary(req.params.beneficiaryId, payload, req.files || {});
    res.json(beneficiary);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteBeneficiary(req, res, next) {
  try {
    const result = await removeBeneficiary(req.params.beneficiaryId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

