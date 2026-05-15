import httpError from '../../core/utils/httpError.js';
import Joi from 'joi';
import {
  getMemberDocuments,
  getMemberDocumentById,
  createNewMemberDocument,
  updateExistingMemberDocument,
  removeMemberDocument,
  verifyDocument
} from './member-document.service.js';

const documentSchema = Joi.object({
  document_type: Joi.string().valid('KEBELE_ID', 'DRIVER_LICENSE', 'PASSPORT', 'WORKER_ID', 'REGISTRATION_RECEIPT').required(),
  document_number: Joi.string().allow(null, '')
});

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListMemberDocuments(req, res, next) {
  try {
    const documentType = req.query.type || null;
    const documents = await getMemberDocuments(req.params.memberId, documentType);
    res.json({ data: documents });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMemberDocument(req, res, next) {
  try {
    const document = await getMemberDocumentById(req.params.documentId);
    res.json(document);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateMemberDocument(req, res, next) {
  try {
    const payload = validate(documentSchema, req.body);
    const document = await createNewMemberDocument(req.params.memberId, payload, req.files || {});
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateMemberDocument(req, res, next) {
  try {
    const payload = validate(documentSchema.fork(Object.keys(documentSchema.describe().keys), (schema) => schema.optional()), req.body);
    const document = await updateExistingMemberDocument(req.params.documentId, payload, req.files || {});
    res.json(document);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteMemberDocument(req, res, next) {
  try {
    const result = await removeMemberDocument(req.params.documentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleVerifyDocument(req, res, next) {
  try {
    const verifiedBy = req.user.userId;
    const document = await verifyDocument(req.params.documentId, verifiedBy);
    res.json(document);
  } catch (error) {
    next(error);
  }
}

