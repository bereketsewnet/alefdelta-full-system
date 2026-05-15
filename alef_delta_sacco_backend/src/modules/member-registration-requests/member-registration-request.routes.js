import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import {
  handleCreateRegistrationRequest,
  handleGetRegistrationRequest,
  handleListRegistrationRequests,
  handleApproveRegistrationRequest,
  handleRejectRegistrationRequest
} from './member-registration-request.controller.js';

const router = Router();

// Public endpoint for self-registration (no auth required)
router.post('/', handleCreateRegistrationRequest);

// Staff endpoints (require authentication)
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER'];

// List all registration requests
router.get('/', authenticate, requireRoles(...staffRoles), handleListRegistrationRequests);

// Get single registration request
router.get('/:requestId', authenticate, requireRoles(...staffRoles), handleGetRegistrationRequest);

// Approve registration request (Teller/Manager only)
router.post(
  '/:requestId/approve',
  authenticate,
  requireRoles('TELLER', 'MANAGER', 'ADMIN'),
  handleApproveRegistrationRequest
);

// Reject registration request (Teller/Manager only)
router.post(
  '/:requestId/reject',
  authenticate,
  requireRoles('TELLER', 'MANAGER', 'ADMIN'),
  handleRejectRegistrationRequest
);

export default router;

