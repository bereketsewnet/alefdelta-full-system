import { verifyAccessToken } from '../utils/jwt.js';
import { findUserById } from '../../modules/users/user.repository.js';
import { findMemberById } from '../../modules/members/member.repository.js';

async function resolveSubject(payload) {
  const subjectType = payload.subjectType || 'STAFF';
  if (subjectType === 'STAFF') {
    const user = await findUserById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new Error('Invalid token subject');
    }
    return {
      subjectType,
      userId: user.user_id,
      role: user.role,
      username: user.username,
      isAdmin: user.role === 'ADMIN'
    };
  }
  const member = await findMemberById(payload.sub);
  if (!member || member.status !== 'ACTIVE') {
    throw new Error('Invalid member');
  }
  return {
    subjectType,
    memberId: member.member_id,
    role: 'MEMBER',
    membershipNo: member.membership_no
  };
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = await resolveSubject(payload);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      req.user = await resolveSubject(payload);
    } catch (error) {
      // ignore invalid token failures
    }
  }
  next();
}

