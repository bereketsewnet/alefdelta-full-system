import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import {
  handleListAccounts,
  handleGetAccount,
  handleGetMemberAccounts,
  handleCreateAccount,
  handleUpdateAccount,
  handleCloseAccount,
  handleFreezeAccount,
  handleUnfreezeAccount,
  handleDeleteAccount
} from './account.controller.js';

const router = Router();
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER', 'AUDITOR'];

// List accounts
router.get('/', authenticate, requireRoles(...staffRoles), handleListAccounts);

// Get accounts for a specific member
router.get('/member/:memberId', authenticate, requireRoles(...staffRoles), handleGetMemberAccounts);

// Get single account
router.get('/:id', authenticate, requireRoles(...staffRoles), handleGetAccount);

// Create account (Teller/Manager/Admin)
router.post('/', authenticate, requireRoles('ADMIN', 'TELLER', 'MANAGER'), handleCreateAccount);

// Update account (Manager/Admin)
router.put('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), handleUpdateAccount);

// Close account (Manager/Admin)
router.post('/:id/close', authenticate, requireRoles('ADMIN', 'MANAGER'), handleCloseAccount);

// Freeze account (Manager/Admin)
router.post('/:id/freeze', authenticate, requireRoles('ADMIN', 'MANAGER'), handleFreezeAccount);

// Unfreeze account (Manager/Admin)
router.post('/:id/unfreeze', authenticate, requireRoles('ADMIN', 'MANAGER'), handleUnfreezeAccount);

// Delete account (Admin only, must be closed with zero balance and no transactions)
router.delete('/:id', authenticate, requireRoles('ADMIN'), handleDeleteAccount);

export default router;
