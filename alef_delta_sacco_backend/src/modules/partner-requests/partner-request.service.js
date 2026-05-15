import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import {
  createPartnerRequest as createPartnerRequestInDb,
  findPartnerRequestById,
  listPartnerRequests,
  updatePartnerRequestStatus
} from './partner-request.repository.js';
import { insertAuditLog } from '../admin/audit.repository.js';

export async function createPartnerRequest(partnerData) {
  const requestId = uuid();
  
  await createPartnerRequestInDb(requestId, partnerData);
  
  await insertAuditLog({
    userId: null,
    action: 'PARTNER_REQUEST_CREATED',
    entity: 'partner_requests',
    entityId: requestId,
    metadata: { phone: partnerData.phone, request_type: partnerData.request_type },
  });
  
  return { request_id: requestId, ...partnerData, status: 'PENDING' };
}

export async function getPartnerRequestById(requestId) {
  const request = await findPartnerRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Partner request not found');
  }
  return request;
}

export async function getAllPartnerRequests(filters = {}) {
  return listPartnerRequests(filters);
}

export async function approvePartnerRequest(requestId, approverId) {
  const request = await findPartnerRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Partner request not found');
  }
  
  if (request.status === 'APPROVED') {
    throw httpError(400, 'Request is already approved');
  }
  if (request.status === 'REJECTED') {
    throw httpError(400, 'Request has been rejected');
  }

  await updatePartnerRequestStatus(requestId, 'APPROVED', approverId);
  
  await insertAuditLog({
    userId: approverId,
    action: 'PARTNER_REQUEST_APPROVED',
    entity: 'partner_requests',
    entityId: requestId,
    metadata: { status: 'APPROVED' },
  });
  
  return findPartnerRequestById(requestId);
}

export async function rejectPartnerRequest(requestId, approverId, rejectionReason) {
  const request = await findPartnerRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Partner request not found');
  }
  
  if (request.status === 'APPROVED') {
    throw httpError(400, 'Cannot reject an approved request');
  }
  if (request.status === 'REJECTED') {
    throw httpError(400, 'Request has already been rejected');
  }

  await updatePartnerRequestStatus(requestId, 'REJECTED', approverId, rejectionReason);
  
  await insertAuditLog({
    userId: approverId,
    action: 'PARTNER_REQUEST_REJECTED',
    entity: 'partner_requests',
    entityId: requestId,
    metadata: { status: 'REJECTED', reason: rejectionReason },
  });
  
  return findPartnerRequestById(requestId);
}

