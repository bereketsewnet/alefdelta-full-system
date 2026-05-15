import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import {
  handleCreatePartnerRequest,
  handleGetPartnerRequest,
  handleListPartnerRequests,
  handleApprovePartnerRequest,
  handleRejectPartnerRequest
} from './partner-request.controller.js';

const router = Router();

// Public endpoint for partner registration (no auth required)
router.post('/', handleCreatePartnerRequest);

// Staff endpoints (require authentication)
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER'];

// List all partner requests
router.get('/', authenticate, requireRoles(...staffRoles), handleListPartnerRequests);

// Get single partner request
router.get('/:requestId', authenticate, requireRoles(...staffRoles), handleGetPartnerRequest);

// Approve partner request (Teller/Manager only)
router.post(
  '/:requestId/approve',
  authenticate,
  requireRoles('TELLER', 'MANAGER', 'ADMIN'),
  handleApprovePartnerRequest
);

// Reject partner request (Teller/Manager only)
router.post(
  '/:requestId/reject',
  authenticate,
  requireRoles('TELLER', 'MANAGER', 'ADMIN'),
  handleRejectPartnerRequest
);

export default router;



