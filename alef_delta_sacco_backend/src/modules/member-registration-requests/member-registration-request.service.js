import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import {
  createMemberRegistrationRequest,
  findMemberRegistrationRequestById,
  listMemberRegistrationRequests,
  updateMemberRegistrationRequestStatus
} from './member-registration-request.repository.js';
import { createNewMember, activateMember } from '../members/member.service.js';
import { findMemberByPhone } from '../members/member.repository.js';
import { createBeneficiary } from '../beneficiaries/beneficiary.repository.js';
import { createEmergencyContact } from '../emergency-contacts/emergency-contact.repository.js';
import { createMemberDocument } from '../member-documents/member-document.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { createNotification } from '../notifications/notification.service.js';

export async function createRegistrationRequest(memberData) {
  const requestId = uuid();
  
  await createMemberRegistrationRequest(requestId, memberData);
  
  await insertAuditLog({
    userId: null,
    action: 'MEMBER_REGISTRATION_REQUEST_CREATED',
    entity: 'member_registration_requests',
    entityId: requestId,
    metadata: { phone: memberData.phone_primary },
  });
  
  return findMemberRegistrationRequestById(requestId);
}

export async function getMemberRegistrationRequestById(requestId) {
  const request = await findMemberRegistrationRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Registration request not found');
  }
  return request;
}

export async function getAllMemberRegistrationRequests(filters = {}) {
  return listMemberRegistrationRequests(filters);
}

export async function approveMemberRegistrationRequest(requestId, approverId, approverRole) {
  const request = await findMemberRegistrationRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Registration request not found');
  }
  
  // Check if request can be approved
  if (request.status === 'APPROVED') {
    throw httpError(400, 'Request is already approved');
  }
  if (request.status === 'REJECTED') {
    throw httpError(400, 'Request has been rejected');
  }

  const memberData = request.member_data;
  if (!memberData) {
    throw httpError(400, 'Invalid registration request data');
  }

  // If teller approves, set status to TELLER_APPROVED and require manager review
  if (approverRole === 'TELLER') {
    if (request.status !== 'PENDING') {
      throw httpError(400, 'Only pending requests can be approved by teller');
    }
    await updateMemberRegistrationRequestStatus(requestId, 'TELLER_APPROVED', approverId);
    await insertAuditLog({
      userId: approverId,
      action: 'MEMBER_REGISTRATION_REQUEST_TELLER_APPROVED',
      entity: 'member_registration_requests',
      entityId: requestId,
      metadata: { status: 'TELLER_APPROVED' },
    });
    return {
      request: await findMemberRegistrationRequestById(requestId),
      message: 'Registration request approved by teller. Awaiting manager approval.'
    };
  }

  // If manager/admin approves, create the member and activate
  // Can approve from PENDING or TELLER_APPROVED status
  if (!['MANAGER', 'ADMIN'].includes(approverRole)) {
    throw httpError(403, 'Only managers and admins can finalize approval');
  }

  // Check if member with this phone number already exists
  const existingMember = await findMemberByPhone(memberData.phone_primary);
  if (existingMember) {
    throw httpError(400, `A member with phone number ${memberData.phone_primary} already exists. Please check if this registration request is a duplicate.`);
  }

  // Create the member using the existing createNewMember function
  let member;
  try {
    member = await createNewMember(memberData);
  } catch (error) {
    // Handle duplicate phone number error
    if (error.original?.code === 'ER_DUP_ENTRY' && error.original?.sqlMessage?.includes('phone_primary')) {
      throw httpError(400, `A member with phone number ${memberData.phone_primary} already exists.`);
    }
    // Re-throw other errors
    throw error;
  }

  // Create beneficiaries if provided
  if (memberData.beneficiaries && Array.isArray(memberData.beneficiaries) && memberData.beneficiaries.length > 0) {
    console.log(`Creating ${memberData.beneficiaries.length} beneficiary(ies) for member ${member.member_id}`);
    for (const beneficiary of memberData.beneficiaries) {
      if (!beneficiary.full_name || !beneficiary.relationship || !beneficiary.phone) {
        console.warn('Skipping invalid beneficiary:', beneficiary);
        continue;
      }
      const beneficiaryId = uuid();
      await createBeneficiary({
        beneficiary_id: beneficiaryId,
        member_id: member.member_id,
        full_name: beneficiary.full_name,
        relationship: beneficiary.relationship,
        phone: beneficiary.phone,
        profile_photo_url: beneficiary.profile_photo_url || null,
        id_front_url: beneficiary.id_front_url || null,
        id_back_url: beneficiary.id_back_url || null,
      });
    }
  }

  // Create emergency contacts if provided
  if (memberData.emergency_contacts && Array.isArray(memberData.emergency_contacts) && memberData.emergency_contacts.length > 0) {
    console.log(`Creating ${memberData.emergency_contacts.length} emergency contact(s) for member ${member.member_id}`);
    for (const contact of memberData.emergency_contacts) {
      if (!contact.full_name || !contact.phone_number) {
        console.warn('Skipping invalid emergency contact:', contact);
        continue;
      }
      const contactId = uuid();
      await createEmergencyContact({
        emergency_contact_id: contactId,
        member_id: member.member_id,
        full_name: contact.full_name,
        subcity: contact.subcity || null,
        woreda: contact.woreda || null,
        kebele: contact.kebele || null,
        house_number: contact.house_number || null,
        phone_number: contact.phone_number,
        relationship: contact.relationship || null,
      });
    }
  }

  // Create member documents if provided
  if (memberData.documents && Array.isArray(memberData.documents)) {
    for (const doc of memberData.documents) {
      const documentId = uuid();
      await createMemberDocument({
        document_id: documentId,
        member_id: member.member_id,
        document_type: doc.document_type,
        document_number: doc.document_number || null,
        front_photo_url: doc.front_photo_url || null,
        back_photo_url: doc.back_photo_url || null,
      });
    }
  }

  // Activate the member (manager approval automatically activates)
  await activateMember(member.member_id, approverId);

  // Update request status
  await updateMemberRegistrationRequestStatus(requestId, 'APPROVED', approverId);

  await insertAuditLog({
    userId: approverId,
    action: 'MEMBER_REGISTRATION_REQUEST_APPROVED',
    entity: 'member_registration_requests',
    entityId: requestId,
    metadata: { member_id: member.member_id, membership_no: member.membership_no },
  });

  // Create notification for the member (if they have a way to be notified)
  // Note: Since they're not registered yet, we might skip this or send via email/SMS if available

  return {
    request: await findMemberRegistrationRequestById(requestId),
    member,
    message: 'Registration request approved and member activated successfully'
  };
}

export async function rejectMemberRegistrationRequest(requestId, approverId, rejectionReason) {
  const request = await findMemberRegistrationRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Registration request not found');
  }
  if (request.status !== 'PENDING') {
    throw httpError(400, `Request is already ${request.status}`);
  }

  await updateMemberRegistrationRequestStatus(requestId, 'REJECTED', approverId, rejectionReason);

  await insertAuditLog({
    userId: approverId,
    action: 'MEMBER_REGISTRATION_REQUEST_REJECTED',
    entity: 'member_registration_requests',
    entityId: requestId,
    metadata: { rejection_reason: rejectionReason },
  });

  return findMemberRegistrationRequestById(requestId);
}

