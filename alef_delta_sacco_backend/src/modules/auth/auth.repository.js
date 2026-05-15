import { execute, query } from '../../core/db.js';

export async function createOtpRequest({ otpId, memberId, code, expiresAt }) {
  await execute(
    `INSERT INTO member_otps
    (otp_id, member_id, code, expires_at, used)
    VALUES (?, ?, ?, ?, 0)`,
    [otpId, memberId, code, expiresAt]
  );
}

export async function findOtpById(otpId) {
  const rows = await query('SELECT * FROM member_otps WHERE otp_id = ?', [otpId]);
  return rows[0];
}

export async function markOtpUsed(otpId) {
  await execute('UPDATE member_otps SET used = 1, used_at = NOW() WHERE otp_id = ?', [otpId]);
}

