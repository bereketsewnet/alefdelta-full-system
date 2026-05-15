import jwt from 'jsonwebtoken';
import config from '../config.js';

export function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    ...options
  });
}

export function signRefreshToken(payload, options = {}) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    ...options
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

