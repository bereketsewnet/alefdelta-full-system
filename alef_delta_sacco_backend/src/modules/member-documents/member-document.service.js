import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import {
  listMemberDocuments,
  findMemberDocumentById,
  createMemberDocument,
  updateMemberDocument,
  deleteMemberDocument,
  verifyMemberDocument
} from './member-document.repository.js';
import { findMemberById } from '../members/member.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';

const VALID_DOCUMENT_TYPES = ['KEBELE_ID', 'DRIVER_LICENSE', 'PASSPORT', 'WORKER_ID', 'REGISTRATION_RECEIPT'];

export async function getMemberDocuments(memberId, documentType = null) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  if (documentType && !VALID_DOCUMENT_TYPES.includes(documentType)) {
    throw httpError(400, 'Invalid document type');
  }
  
  return listMemberDocuments(memberId, documentType);
}

export async function getMemberDocumentById(documentId) {
  const document = await findMemberDocumentById(documentId);
  if (!document) {
    throw httpError(404, 'Document not found');
  }
  return document;
}

export async function createNewMemberDocument(memberId, payload, files) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  if (!VALID_DOCUMENT_TYPES.includes(payload.document_type)) {
    throw httpError(400, 'Invalid document type');
  }
  
  const documentId = uuid();
  
  // Handle file uploads - support multiple files for front and back
  let frontPhotoUrl = null;
  let backPhotoUrl = null;
  
  if (files?.front_photo && files.front_photo.length > 0) {
    // For multi-upload, we'll store the first one as the primary
    // In a more advanced implementation, we could store multiple URLs in JSON
    frontPhotoUrl = toPublicUrl(files.front_photo[0].path);
  }
  
  if (files?.back_photo && files.back_photo.length > 0) {
    backPhotoUrl = toPublicUrl(files.back_photo[0].path);
  }
  
  await createMemberDocument({
    document_id: documentId,
    member_id: memberId,
    document_type: payload.document_type,
    document_number: payload.document_number || null,
    front_photo_url: frontPhotoUrl,
    back_photo_url: backPhotoUrl
  });
  
  return findMemberDocumentById(documentId);
}

export async function updateExistingMemberDocument(documentId, payload, files) {
  const document = await findMemberDocumentById(documentId);
  if (!document) {
    throw httpError(404, 'Document not found');
  }
  
  const updates = {};
  if (payload.document_number !== undefined) updates.document_number = payload.document_number || null;
  
  if (files?.front_photo && files.front_photo.length > 0) {
    updates.front_photo_url = toPublicUrl(files.front_photo[0].path);
  }
  
  if (files?.back_photo && files.back_photo.length > 0) {
    updates.back_photo_url = toPublicUrl(files.back_photo[0].path);
  }
  
  if (Object.keys(updates).length > 0) {
    await updateMemberDocument(documentId, updates);
  }
  
  return findMemberDocumentById(documentId);
}

export async function removeMemberDocument(documentId) {
  const document = await findMemberDocumentById(documentId);
  if (!document) {
    throw httpError(404, 'Document not found');
  }
  await deleteMemberDocument(documentId);
  return { success: true, message: 'Document deleted successfully' };
}

export async function verifyDocument(documentId, verifiedBy) {
  const document = await findMemberDocumentById(documentId);
  if (!document) {
    throw httpError(404, 'Document not found');
  }
  await verifyMemberDocument(documentId, verifiedBy);
  return findMemberDocumentById(documentId);
}

