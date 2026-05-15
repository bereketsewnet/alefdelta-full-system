import httpError from '../../core/utils/httpError.js';
import { findUserById, updateUserPassword, resetUserPassword as resetUserPasswordInDb, createUser, findUserByUsername, findUserByEmail, listUsers, updateUser as updateUserInDb, deleteUser as deleteUserInDb } from './user.repository.js';
import { comparePassword, hashPassword } from '../../core/utils/password.js';
import { v4 as uuid } from 'uuid';

export async function changePasswordForUser(userId, currentPassword, newPassword, actor) {
  if (!userId) {
    throw httpError(400, 'User id is required');
  }
  if (actor.userId !== userId && !actor.isAdmin) {
    throw httpError(403, 'You can only change your own password');
  }
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'User not found');
  }
  const match = await comparePassword(currentPassword, user.password_hash);
  if (!match) {
    throw httpError(400, 'Current password invalid');
  }
  const hash = await hashPassword(newPassword);
  await updateUserPassword(userId, hash);
  return { success: true };
}

export async function createNewUser(payload) {
  const { username, password, role, email, phone, status = 'ACTIVE' } = payload;
  
  // Check if username already exists
  const existingUserByUsername = await findUserByUsername(username);
  if (existingUserByUsername) {
    throw httpError(409, 'Username already exists');
  }
  
  // Check if email already exists
  const existingUserByEmail = await findUserByEmail(email);
  if (existingUserByEmail) {
    throw httpError(409, 'Email already exists');
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  const user_id = uuid();
  const user = await createUser({
    user_id,
    username,
    password_hash: passwordHash,
    role,
    email,
    phone,
    status
  });
  
  // Return safe user object (without password_hash)
  return {
    user_id: user.user_id,
    username: user.username,
    role: user.role,
    email: user.email,
    phone: user.phone,
    status: user.status
  };
}

export async function getUsers(filters = {}) {
  const users = await listUsers(filters);
  return users;
}

export async function updateUser(userId, payload, actor) {
  // Only admins can update users
  if (!actor.isAdmin) {
    throw httpError(403, 'Only admins can update users');
  }
  
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  // Check if username is being changed and if it already exists
  if (payload.username && payload.username !== user.username) {
    const existingUser = await findUserByUsername(payload.username);
    if (existingUser && existingUser.user_id !== userId) {
      throw httpError(409, 'Username already exists');
    }
  }
  
  // Check if email is being changed and if it already exists
  if (payload.email && payload.email !== user.email) {
    const existingUser = await findUserByEmail(payload.email);
    if (existingUser && existingUser.user_id !== userId) {
      throw httpError(409, 'Email already exists');
    }
  }
  
  const updatedUser = await updateUserInDb(userId, payload);
  
  // Return safe user object
  return {
    user_id: updatedUser.user_id,
    username: updatedUser.username,
    role: updatedUser.role,
    email: updatedUser.email,
    phone: updatedUser.phone,
    status: updatedUser.status
  };
}

export async function deleteUserById(userId, actor) {
  // Only admins can delete users
  if (!actor.isAdmin) {
    throw httpError(403, 'Only admins can delete users');
  }
  
  // Prevent admin from deleting themselves
  if (actor.userId === userId) {
    throw httpError(400, 'You cannot delete your own account');
  }
  
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  await deleteUserInDb(userId);
  return { success: true, message: 'User deleted successfully' };
}

export async function resetUserPassword(userId, newPassword, actor) {
  // Only admins can reset passwords
  if (!actor.isAdmin) {
    throw httpError(403, 'Only admins can reset user passwords');
  }
  
  // Prevent admin from resetting their own password (they should use change password)
  if (actor.userId === userId) {
    throw httpError(400, 'You cannot reset your own password. Please use the change password feature.');
  }
  
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  // Hash the new password
  const passwordHash = await hashPassword(newPassword);
  
  // Reset password (this will also set force_password_reset flag)
  await resetUserPasswordInDb(userId, passwordHash);
  
  return { success: true, message: 'User password reset successfully' };
}

