import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { hashPassword } from '../../core/utils/password.js';
import {
  listMembers,
  findMemberById,
  createMember,
  updateMember,
  updateMemberPassword,
  resetMemberPassword,
  deleteMember,
  countMembers,
  findMemberByPhone
} from './member.repository.js';
import { createBeneficiary, listBeneficiaries } from '../beneficiaries/beneficiary.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import { query } from '../../core/db.js';

function generateMembershipNumber() {
  return `MEM-${Date.now()}`;
}

export async function getMembers(filters) {
  const data = await listMembers(filters);
  const total = await countMembers(filters);
  return { data, total, limit: filters.limit || 25, offset: filters.offset || 0 };
}

export async function getMemberById(memberId) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const beneficiaries = await listBeneficiaries(memberId);
  return { ...member, beneficiaries };
}

// Transform frontend values to database values
function transformMemberPayload(payload) {
  const transformed = { ...payload };
  
  // Transform gender: M -> MALE, F -> FEMALE
  if (transformed.gender === 'M') {
    transformed.gender = 'MALE';
  } else if (transformed.gender === 'F') {
    transformed.gender = 'FEMALE';
  }
  // MALE, FEMALE, OTHER are already correct
  
  // Transform member_type: TRADER/FARMER/SELF -> database values
  if (transformed.member_type === 'TRADER') {
    transformed.member_type = 'SME';
  } else if (transformed.member_type === 'FARMER' || transformed.member_type === 'SELF') {
    transformed.member_type = 'INDIVIDUAL';
  }
  // INDIVIDUAL, GOV_EMP, NGO, SME are already correct
  
  // Convert undefined to null for optional fields
  const optionalFields = ['middle_name', 'email', 'address_subcity', 'address_woreda', 'address_house_no', 
    'tin_number', 'profile_photo_url', 'id_card_url', 'id_card_front_url', 'id_card_back_url', 'age', 'educational_level', 'occupation', 
    'work_experience_years', 'address_kebele', 'address_area_name', 'national_id_number'];
  optionalFields.forEach(field => {
    if (transformed[field] === undefined || transformed[field] === '') {
      transformed[field] = null;
    }
  });
  
  // Convert string numeric values to numbers
  if (transformed.age !== undefined && transformed.age !== null && transformed.age !== '') {
    transformed.age = typeof transformed.age === 'string' ? parseInt(transformed.age, 10) : transformed.age;
    if (isNaN(transformed.age)) transformed.age = null;
  } else {
    transformed.age = null;
  }
  
  if (transformed.family_size_female !== undefined && transformed.family_size_female !== null && transformed.family_size_female !== '') {
    transformed.family_size_female = typeof transformed.family_size_female === 'string' ? parseInt(transformed.family_size_female, 10) : transformed.family_size_female;
    if (isNaN(transformed.family_size_female)) transformed.family_size_female = 0;
  } else {
    transformed.family_size_female = 0;
  }
  
  if (transformed.family_size_male !== undefined && transformed.family_size_male !== null && transformed.family_size_male !== '') {
    transformed.family_size_male = typeof transformed.family_size_male === 'string' ? parseInt(transformed.family_size_male, 10) : transformed.family_size_male;
    if (isNaN(transformed.family_size_male)) transformed.family_size_male = 0;
  } else {
    transformed.family_size_male = 0;
  }
  
  if (transformed.work_experience_years !== undefined && transformed.work_experience_years !== null && transformed.work_experience_years !== '') {
    transformed.work_experience_years = typeof transformed.work_experience_years === 'string' ? parseInt(transformed.work_experience_years, 10) : transformed.work_experience_years;
    if (isNaN(transformed.work_experience_years)) transformed.work_experience_years = null;
  } else {
    transformed.work_experience_years = null;
  }
  
  if (transformed.monthly_income !== undefined && transformed.monthly_income !== null && transformed.monthly_income !== '') {
    transformed.monthly_income = typeof transformed.monthly_income === 'string' ? parseFloat(transformed.monthly_income) : transformed.monthly_income;
    if (isNaN(transformed.monthly_income)) transformed.monthly_income = 0;
  } else {
    transformed.monthly_income = 0;
  }
  
  if (transformed.shares_requested !== undefined && transformed.shares_requested !== null && transformed.shares_requested !== '') {
    transformed.shares_requested = typeof transformed.shares_requested === 'string' ? parseInt(transformed.shares_requested, 10) : transformed.shares_requested;
    if (isNaN(transformed.shares_requested)) transformed.shares_requested = 0;
  } else {
    transformed.shares_requested = 0;
  }
  
  // Handle terms acceptance
  if (transformed.terms_accepted === true) {
    transformed.terms_accepted_at = new Date();
  } else {
    transformed.terms_accepted = false;
    transformed.terms_accepted_at = null;
  }
  
  // Ensure status has a default - new members are PENDING until manager activates them
  if (!transformed.status) {
    transformed.status = 'PENDING';
  }
  
  return transformed;
}

export async function createNewMember(payload) {
  // Check for duplicate phone number before creating
  const existingMember = await findMemberByPhone(payload.phone_primary);
  if (existingMember) {
    throw httpError(400, `A member with phone number ${payload.phone_primary} already exists. Please use a different phone number.`);
  }
  
  const memberId = uuid();
  const passwordHash = await hashPassword(payload.password);
  
  // Transform frontend values to database format
  const transformedPayload = transformMemberPayload(payload);
  
  try {
    await createMember({
      ...transformedPayload,
      member_id: memberId,
      membership_no: generateMembershipNumber(),
      password_hash: passwordHash
    });
  } catch (error) {
    // Handle unique constraint errors with better messages
    if (error.name === 'SequelizeUniqueConstraintError' || error.message?.includes('Duplicate entry')) {
      if (error.message?.includes('phone_primary') || error.fields?.includes('phone_primary')) {
        throw httpError(400, `A member with phone number ${payload.phone_primary} already exists. Please use a different phone number.`);
      } else if (error.message?.includes('membership_no') || error.fields?.includes('membership_no')) {
        throw httpError(400, 'Membership number conflict. Please try again.');
      } else {
        throw httpError(400, 'A member with this information already exists. Please check for duplicates.');
      }
    }
    throw error;
  }
  
  return getMemberById(memberId);
}

export async function updateExistingMember(memberId, payload) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  // Handle password update separately if provided
  if (payload.password && payload.password.trim() !== '') {
    const passwordHash = await hashPassword(payload.password);
    await updateMemberPassword(memberId, passwordHash);
    // Remove password from payload to avoid including it in regular update
    delete payload.password;
  }
  
  // Transform frontend values to database format
  const transformedPayload = transformMemberPayload(payload);
  await updateMember(memberId, transformedPayload);
  return getMemberById(memberId);
}

export async function saveMemberUploads(memberId, files) {
  const updates = {};
  
  try {
    if (files.profile_photo?.[0]) {
      const filePath = files.profile_photo[0].path || files.profile_photo[0].destination + '/' + files.profile_photo[0].filename;
      updates.profile_photo_url = toPublicUrl(filePath);
    }
    if (files.id_card_front?.[0]) {
      const filePath = files.id_card_front[0].path || files.id_card_front[0].destination + '/' + files.id_card_front[0].filename;
      updates.id_card_front_url = toPublicUrl(filePath);
    }
    if (files.id_card_back?.[0]) {
      const filePath = files.id_card_back[0].path || files.id_card_back[0].destination + '/' + files.id_card_back[0].filename;
      updates.id_card_back_url = toPublicUrl(filePath);
    }
    // Support legacy id_card field for backward compatibility
    if (files.id_card?.[0]) {
      const filePath = files.id_card[0].path || files.id_card[0].destination + '/' + files.id_card[0].filename;
      updates.id_card_front_url = toPublicUrl(filePath);
    }
    
    if (!Object.keys(updates).length) {
      throw httpError(400, 'No files processed');
    }
    
    await updateMember(memberId, updates);
    return getMemberById(memberId);
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Files received:', JSON.stringify(Object.keys(files || {})));
    throw error;
  }
}

export async function addMemberBeneficiary(memberId, payload, files) {
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
    id_front_url: files?.id_front?.[0] ? toPublicUrl(files.id_front[0].path) : null,
    id_back_url: files?.id_back?.[0] ? toPublicUrl(files.id_back[0].path) : null
  });
  return listBeneficiaries(memberId);
}

export async function removeMember(memberId, actor) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  // Check if member has active loans or non-zero balances
  const accounts = await query('SELECT * FROM accounts WHERE member_id = ? AND (balance != 0 OR status = ?)', [memberId, 'ACTIVE']);
  if (accounts.length > 0) {
    throw httpError(400, 'Cannot delete member with active accounts or non-zero balances');
  }
  const activeLoans = await query('SELECT * FROM loan_applications WHERE member_id = ? AND workflow_status IN (?, ?, ?)', [memberId, 'APPROVED', 'DISBURSED', 'REVIEW']);
  if (activeLoans.length > 0) {
    throw httpError(400, 'Cannot delete member with active loans');
  }
  await deleteMember(memberId);
  return { success: true, message: 'Member deleted successfully' };
}

export async function activateMember(memberId, actor) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  if (member.status === 'ACTIVE') {
    throw httpError(400, 'Member is already active');
  }
  await updateMember(memberId, { status: 'ACTIVE' });
  return getMemberById(memberId);
}

export async function suspendMember(memberId, actor, reason) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  await updateMember(memberId, { status: 'SUSPENDED' });
  return getMemberById(memberId);
}

export async function resetMemberPasswordById(memberId, newPassword, actor) {
  // Only admins can reset member passwords
  if (!actor.isAdmin) {
    throw httpError(403, 'Only admins can reset member passwords');
  }
  
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  // Hash the new password
  const passwordHash = await hashPassword(newPassword);
  
  // Reset password
  await resetMemberPassword(memberId, passwordHash);
  
  return { success: true, message: 'Member password reset successfully' };
}

