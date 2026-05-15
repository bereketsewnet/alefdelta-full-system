import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import {
  listBeneficiaries,
  findBeneficiaryById,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary
} from './beneficiary.repository.js';
import { findMemberById } from '../members/member.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';

export async function getBeneficiariesForMember(memberId) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  return listBeneficiaries(memberId);
}

export async function getBeneficiaryById(beneficiaryId) {
  const beneficiary = await findBeneficiaryById(beneficiaryId);
  if (!beneficiary) {
    throw httpError(404, 'Beneficiary not found');
  }
  return beneficiary;
}

export async function createNewBeneficiary(memberId, payload, files) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  const beneficiaryId = uuid();
  await createBeneficiary({
    beneficiary_id: beneficiaryId,
    member_id: memberId,
    full_name: payload.full_name,
    relationship: payload.relationship,
    phone: payload.phone,
    profile_photo_url: files?.profile_photo?.[0] ? toPublicUrl(files.profile_photo[0].path) : null,
    id_front_url: files?.id_card_front?.[0] ? toPublicUrl(files.id_card_front[0].path) : null,
    id_back_url: files?.id_card_back?.[0] ? toPublicUrl(files.id_card_back[0].path) : null
  });
  
  return findBeneficiaryById(beneficiaryId);
}

export async function updateExistingBeneficiary(beneficiaryId, payload, files) {
  const beneficiary = await findBeneficiaryById(beneficiaryId);
  if (!beneficiary) {
    throw httpError(404, 'Beneficiary not found');
  }
  
  const updates = {};
  if (payload.full_name) updates.full_name = payload.full_name;
  if (payload.relationship) updates.relationship = payload.relationship;
  if (payload.phone) updates.phone = payload.phone;
  
  if (files?.profile_photo?.[0]) {
    updates.profile_photo_url = toPublicUrl(files.profile_photo[0].path);
  }
  if (files?.id_card_front?.[0]) {
    updates.id_front_url = toPublicUrl(files.id_card_front[0].path);
  }
  if (files?.id_card_back?.[0]) {
    updates.id_back_url = toPublicUrl(files.id_card_back[0].path);
  }
  
  if (Object.keys(updates).length > 0) {
    await updateBeneficiary(beneficiaryId, updates);
  }
  
  return findBeneficiaryById(beneficiaryId);
}

export async function removeBeneficiary(beneficiaryId) {
  const beneficiary = await findBeneficiaryById(beneficiaryId);
  if (!beneficiary) {
    throw httpError(404, 'Beneficiary not found');
  }
  await deleteBeneficiary(beneficiaryId);
  return { success: true, message: 'Beneficiary deleted successfully' };
}

