import httpError from '../../core/utils/httpError.js';
import { findUserById, resetUserPassword } from '../users/user.repository.js';
import { generateRandomPassword, hashPassword } from '../../core/utils/password.js';
import { insertAuditLog } from './audit.repository.js';

export async function resetPasswordForUser(targetUserId, actor) {
  if (!actor || actor.role !== 'ADMIN') {
    throw httpError(403, 'Only admins can reset user passwords');
  }
  if (!targetUserId) {
    throw httpError(400, 'Target user id is required');
  }
  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw httpError(404, 'Target user not found');
  }
  if (targetUser.role === 'ADMIN') {
    throw httpError(400, 'Admin passwords cannot be reset via this endpoint');
  }
  const plainPassword = generateRandomPassword(16);
  const passwordHash = await hashPassword(plainPassword);
  await resetUserPassword(targetUserId, passwordHash);
  await insertAuditLog({
    userId: actor.userId,
    action: 'RESET_PASSWORD',
    entity: 'users',
    entityId: targetUserId,
    metadata: { resetBy: actor.userId }
  });
  return { success: true, new_password: plainPassword };
}

