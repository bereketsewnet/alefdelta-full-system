import httpError from '../../core/utils/httpError.js';
import Joi from 'joi';
import {
  createRegistrationRequest,
  getMemberRegistrationRequestById,
  getAllMemberRegistrationRequests,
  approveMemberRegistrationRequest,
  rejectMemberRegistrationRequest
} from './member-registration-request.service.js';
import { createMemberSchema } from '../members/member.validators.js';

// Schema for registration request (similar to createMemberSchema but allows nested data)
const registrationRequestSchema = createMemberSchema.keys({
  // Allow ID card URLs (separate from documents)
  id_card_front_url: Joi.string().allow(null, '').optional(),
  id_card_back_url: Joi.string().allow(null, '').optional(),
  beneficiaries: Joi.array().items(Joi.object({
    full_name: Joi.string().required(),
    relationship: Joi.string().required(),
    phone: Joi.string().required(),
    profile_photo_url: Joi.string().allow(null, ''),
    id_front_url: Joi.string().allow(null, ''),
    id_back_url: Joi.string().allow(null, '')
  })).optional(),
  emergency_contacts: Joi.array().items(Joi.object({
    full_name: Joi.string().required(),
    subcity: Joi.string().allow(null, ''),
    woreda: Joi.string().allow(null, ''),
    kebele: Joi.string().allow(null, ''),
    house_number: Joi.string().allow(null, ''),
    phone_number: Joi.string().required(),
    relationship: Joi.string().allow(null, '')
  })).optional(),
  documents: Joi.array().items(Joi.object({
    document_type: Joi.string().valid('KEBELE_ID', 'DRIVER_LICENSE', 'PASSPORT', 'WORKER_ID', 'REGISTRATION_RECEIPT').required(),
    document_number: Joi.string().allow(null, ''),
    front_photo_url: Joi.string().allow(null, ''),
    back_photo_url: Joi.string().allow(null, '')
  })).optional()
});

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleCreateRegistrationRequest(req, res, next) {
  try {
    const payload = validate(registrationRequestSchema, req.body);
    const request = await createRegistrationRequest(payload);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

export async function handleGetRegistrationRequest(req, res, next) {
  try {
    const request = await getMemberRegistrationRequestById(req.params.requestId);
    res.json(request);
  } catch (error) {
    next(error);
  }
}

export async function handleListRegistrationRequests(req, res, next) {
  try {
    const filters = {
      status: req.query.status || 'ALL'
    };
    const requests = await getAllMemberRegistrationRequests(filters);
    res.json({ data: requests });
  } catch (error) {
    next(error);
  }
}

export async function handleApproveRegistrationRequest(req, res, next) {
  try {
    const approverId = req.user.userId;
    const approverRole = req.user.role;
    const result = await approveMemberRegistrationRequest(req.params.requestId, approverId, approverRole);
    res.json({
      message: result.message || 'Registration request approved and member created successfully',
      request: result.request,
      member: result.member
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectRegistrationRequest(req, res, next) {
  try {
    const approverId = req.user.userId;
    const { rejection_reason } = req.body;
    
    if (!rejection_reason || rejection_reason.trim() === '') {
      throw httpError(400, 'Rejection reason is required');
    }
    
    const request = await rejectMemberRegistrationRequest(req.params.requestId, approverId, rejection_reason);
    res.json({
      message: 'Registration request rejected',
      request
    });
  } catch (error) {
    next(error);
  }
}

