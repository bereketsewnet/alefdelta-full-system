import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { findUserByUsername, findUserById, updateUserPassword, findUserByIdentifier } from '../users/user.repository.js';
import {
  findMemberByPhone,
  findMemberById,
  updateMemberPassword
} from '../members/member.repository.js';
import { comparePassword, hashPassword } from '../../core/utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../../core/utils/jwt.js';
import { createOtpRequest, findOtpById, markOtpUsed } from './auth.repository.js';
import { generateOtp, getExpiryDate } from '../../core/utils/otp.js';
import httpError from '../../core/utils/httpError.js';
import { sendMail } from '../../core/utils/mailer.js';

export async function login({ actor = 'STAFF', identifier, password }) {
  const normalizedActor = actor.toUpperCase();
  if (!identifier || !password) {
    throw httpError(400, 'Identifier and password are required');
  }

  if (normalizedActor === 'STAFF') {
    // Support login by username or email
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      console.log(`Login failed: User not found for identifier '${identifier}'`);
      throw httpError(401, 'Invalid credentials');
    }
    // Check if user is active
    if (user.status !== 'ACTIVE') {
      console.log(`Login failed: User '${identifier}' is not ACTIVE (status: ${user.status})`);
      throw httpError(403, 'Account is disabled');
    }
    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      console.log(`Login failed: Password mismatch for user '${identifier}'`);
      throw httpError(401, 'Invalid credentials');
    }
    const payload = { sub: user.user_id, role: user.role, subjectType: 'STAFF' };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    };
  }


  const member = await findMemberByPhone(identifier);
  if (!member) {
    throw httpError(401, 'Invalid credentials');
  }
  // Check if member is active - PENDING members cannot login
  if (member.status !== 'ACTIVE') {
    throw httpError(403, 'Account is not active. Please contact the manager for activation.');
  }
  const match = await comparePassword(password, member.password_hash);
  if (!match) {
    throw httpError(401, 'Invalid credentials');
  }
  const payload = { sub: member.member_id, role: 'MEMBER', subjectType: 'MEMBER' };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    member: {
      member_id: member.member_id,
      first_name: member.first_name,
      last_name: member.last_name,
      membership_no: member.membership_no
    }
  };
}

export async function refreshToken(token) {
  if (!token) {
    throw httpError(400, 'Refresh token is required');
  }
  const payload = verifyRefreshToken(token);
  if (payload.subjectType === 'STAFF') {
    const user = await findUserById(payload.sub);
    if (!user) {
      throw httpError(401, 'Invalid refresh token');
    }
    return {
      accessToken: signAccessToken({ sub: user.user_id, role: user.role, subjectType: 'STAFF' })
    };
  }
  const member = await findMemberById(payload.sub);
  if (!member) {
    throw httpError(401, 'Invalid refresh token');
  }
  return {
    accessToken: signAccessToken({ sub: member.member_id, role: 'MEMBER', subjectType: 'MEMBER' })
  };
}

export async function requestOtp({ phone }) {
  if (!phone) {
    throw httpError(400, 'Phone is required');
  }
  const member = await findMemberByPhone(phone);
  if (!member) {
    throw httpError(404, 'Member not found for OTP');
  }
  if (!member.email) {
    throw httpError(400, 'Member email is required for OTP delivery');
  }
  const code = generateOtp();
  const otpId = uuid();
  const expiresAt = getExpiryDate();
  await createOtpRequest({
    otpId,
    memberId: member.member_id,
    code,
    expiresAt
  });
  await sendMail({
    to: member.email,
    subject: 'ALEF-DELTA SACCO Password Reset OTP',
    text: `Use OTP ${code} to reset your password. It expires at ${dayjs(expiresAt).format(
      'YYYY-MM-DD HH:mm'
    )}.`
  });
  return { otp_request_id: otpId };
}

export async function verifyOtp({ otp_request_id: otpRequestId, code, new_password: newPassword }) {
  if (!otpRequestId || !code || !newPassword) {
    throw httpError(400, 'OTP request id, code and new password are required');
  }
  const record = await findOtpById(otpRequestId);
  if (!record) {
    throw httpError(404, 'OTP request not found');
  }
  if (record.used) {
    throw httpError(400, 'OTP already used');
  }
  if (new Date(record.expires_at) < new Date()) {
    throw httpError(400, 'OTP expired');
  }
  if (record.code !== code) {
    throw httpError(400, 'Invalid OTP code');
  }
  const member = await findMemberById(record.member_id);
  if (!member) {
    throw httpError(404, 'Member missing for OTP');
  }
  const passwordHash = await hashPassword(newPassword);
  await updateMemberPassword(member.member_id, passwordHash);
  await markOtpUsed(otpRequestId);
  const tempToken = signAccessToken(
    { sub: member.member_id, role: 'MEMBER', subjectType: 'MEMBER' },
    { expiresIn: '15m' }
  );
  return { success: true, temp_token: tempToken };
}

export async function changePassword({ subjectType, subjectId, currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw httpError(400, 'Current and new passwords are required');
  }
  if (subjectType === 'STAFF') {
    const user = await findUserById(subjectId);
    if (!user) {
      throw httpError(404, 'User not found');
    }
    const match = await comparePassword(currentPassword, user.password_hash);
    if (!match) {
      throw httpError(400, 'Current password invalid');
    }
    const hash = await hashPassword(newPassword);
    await updateUserPassword(subjectId, hash);
    return { success: true };
  }
  const member = await findMemberById(subjectId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const match = await comparePassword(currentPassword, member.password_hash);
  if (!match) {
    throw httpError(400, 'Current password invalid');
  }
  const hash = await hashPassword(newPassword);
  await updateMemberPassword(subjectId, hash);
  return { success: true };
}

export async function getCurrentUser({ userId, role, subjectType }) {
  if (subjectType === 'STAFF') {
    const user = await findUserById(userId);
    if (!user) throw httpError(404, 'User not found');
    // Return safe user object
    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone,
      full_name: user.username // mapping for frontend
    };
  }
  
  const member = await findMemberById(userId);
  if (!member) throw httpError(404, 'Member not found');
  
  return {
    member_id: member.member_id,
    membership_no: member.membership_no,
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone_primary,
    full_name: `${member.first_name} ${member.last_name}`,
    role: 'MEMBER' // Explicit role for frontend logic
  };
}

