import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleResetPassword } from './admin.controller.js';

const router = Router();

router.post(
  '/users/:id/reset-password',
  authenticate,
  requireRoles('ADMIN'),
  handleResetPassword
);

export default router;

