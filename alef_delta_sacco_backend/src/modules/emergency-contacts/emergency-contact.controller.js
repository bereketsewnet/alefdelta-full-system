import httpError from '../../core/utils/httpError.js';
import Joi from 'joi';
import {
  getEmergencyContactsForMember,
  getEmergencyContactById,
  createNewEmergencyContact,
  updateExistingEmergencyContact,
  removeEmergencyContact
} from './emergency-contact.service.js';
import { emergencyContactSchema } from '../members/member.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListEmergencyContacts(req, res, next) {
  try {
    const contacts = await getEmergencyContactsForMember(req.params.memberId);
    res.json({ data: contacts });
  } catch (error) {
    next(error);
  }
}

export async function handleGetEmergencyContact(req, res, next) {
  try {
    const contact = await getEmergencyContactById(req.params.contactId);
    res.json(contact);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateEmergencyContact(req, res, next) {
  try {
    const payload = validate(emergencyContactSchema, req.body);
    const contact = await createNewEmergencyContact(req.params.memberId, payload);
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateEmergencyContact(req, res, next) {
  try {
    const payload = validate(emergencyContactSchema.fork(Object.keys(emergencyContactSchema.describe().keys), (schema) => schema.optional()), req.body);
    const contact = await updateExistingEmergencyContact(req.params.contactId, payload);
    res.json(contact);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteEmergencyContact(req, res, next) {
  try {
    const result = await removeEmergencyContact(req.params.contactId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

