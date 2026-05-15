import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import config from '../config.js';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, config.bcrypt.saltRounds);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

