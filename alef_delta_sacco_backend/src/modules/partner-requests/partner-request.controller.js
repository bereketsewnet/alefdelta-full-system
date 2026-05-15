import httpError from '../../core/utils/httpError.js';
import Joi from 'joi';
import {
  createPartnerRequest,
  getPartnerRequestById,
  getAllPartnerRequests,
  approvePartnerRequest,
  rejectPartnerRequest
} from './partner-request.service.js';

// Schema for partner request
const partnerRequestSchema = Joi.object({
  name: Joi.string().min(2).required(),
  company_name: Joi.string().allow(null, '').optional(),
  phone: Joi.string().pattern(/^\+251\d{9}$/).required(),
  request_type: Joi.string().valid('PARTNERSHIP', 'SPONSORSHIP').required(),
  sponsorship_type: Joi.when('request_type', {
    is: 'SPONSORSHIP',
    then: Joi.string().valid('PLATINUM', 'GOLD', 'SILVER').required(),
    otherwise: Joi.optional()
  })
});

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleCreatePartnerRequest(req, res, next) {
  try {
    const payload = validate(partnerRequestSchema, req.body);
    const request = await createPartnerRequest(payload);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

export async function handleGetPartnerRequest(req, res, next) {
  try {
    const request = await getPartnerRequestById(req.params.requestId);
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleListPartnerRequests(req, res, next) {
  try {
    const filters = {
      status: req.query.status || 'ALL'
    };
    const requests = await getAllPartnerRequests(filters);
    res.json({ data: requests });
  } catch (error) {
    next(error);
  }
}

export async function handleApprovePartnerRequest(req, res, next) {
  try {
    const request = await approvePartnerRequest(
      req.params.requestId,
      req.user.userId
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectPartnerRequest(req, res, next) {
  try {
    const request = await rejectPartnerRequest(
      req.params.requestId,
      req.user.userId,
      req.body.reason
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}



