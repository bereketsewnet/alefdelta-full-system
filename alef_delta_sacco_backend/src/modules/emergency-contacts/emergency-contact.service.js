import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import {
  listEmergencyContacts,
  findEmergencyContactById,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} from './emergency-contact.repository.js';
import { findMemberById } from '../members/member.repository.js';

export async function getEmergencyContactsForMember(memberId) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  return listEmergencyContacts(memberId);
}

export async function getEmergencyContactById(contactId) {
  const contact = await findEmergencyContactById(contactId);
  if (!contact) {
    throw httpError(404, 'Emergency contact not found');
  }
  return contact;
}

export async function createNewEmergencyContact(memberId, payload) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  const contactId = uuid();
  await createEmergencyContact({
    emergency_contact_id: contactId,
    member_id: memberId,
    full_name: payload.full_name,
    subcity: payload.subcity || null,
    woreda: payload.woreda || null,
    kebele: payload.kebele || null,
    house_number: payload.house_number || null,
    phone_number: payload.phone_number,
    relationship: payload.relationship || null
  });
  
  return findEmergencyContactById(contactId);
}

export async function updateExistingEmergencyContact(contactId, payload) {
  const contact = await findEmergencyContactById(contactId);
  if (!contact) {
    throw httpError(404, 'Emergency contact not found');
  }
  
  const updates = {};
  if (payload.full_name !== undefined) updates.full_name = payload.full_name;
  if (payload.subcity !== undefined) updates.subcity = payload.subcity || null;
  if (payload.woreda !== undefined) updates.woreda = payload.woreda || null;
  if (payload.kebele !== undefined) updates.kebele = payload.kebele || null;
  if (payload.house_number !== undefined) updates.house_number = payload.house_number || null;
  if (payload.phone_number !== undefined) updates.phone_number = payload.phone_number;
  if (payload.relationship !== undefined) updates.relationship = payload.relationship || null;
  
  if (Object.keys(updates).length > 0) {
    await updateEmergencyContact(contactId, updates);
  }
  
  return findEmergencyContactById(contactId);
}

export async function removeEmergencyContact(contactId) {
  const contact = await findEmergencyContactById(contactId);
  if (!contact) {
    throw httpError(404, 'Emergency contact not found');
  }
  await deleteEmergencyContact(contactId);
  return { success: true, message: 'Emergency contact deleted successfully' };
}

