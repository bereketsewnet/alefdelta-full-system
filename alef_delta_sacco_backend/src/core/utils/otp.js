import crypto from 'node:crypto';
import config from '../config.js';

export function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i += 1) {
    const idx = crypto.randomInt(0, digits.length);
    otp += digits[idx];
  }
  return otp;
}

export function getExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expirationMinutes);
  return expiresAt;
}

