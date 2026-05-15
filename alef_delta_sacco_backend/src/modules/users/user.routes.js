import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { handleCreateUser, handleListUsers, handleChangePassword, handleUpdateUser, handleDeleteUser, handleResetPassword } from './user.controller.js';
import { requireRoles } from '../../core/middleware/roles.js';

const router = Router();

// List users (Admin only)
router.get('/', authenticate, requireRoles('ADMIN'), handleListUsers);

// Create user (Admin only)
router.post('/', authenticate, requireRoles('ADMIN'), handleCreateUser);

// Update user (Admin only)
router.put('/:id', authenticate, requireRoles('ADMIN'), handleUpdateUser);

// Delete user (Admin only)
router.delete('/:id', authenticate, requireRoles('ADMIN'), handleDeleteUser);

// Change password (user can change their own password)
router.post('/:id/change-password', authenticate, handleChangePassword);

// Reset password (Admin only, cannot reset own password)
router.post('/:id/reset-password', authenticate, requireRoles('ADMIN'), handleResetPassword);

export default router;

