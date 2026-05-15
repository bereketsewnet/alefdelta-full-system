import { Router } from 'express';
import { authenticate, optionalAuth } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import {
  handleCreateLoanRequest,
  handleGetLoanRequests,
  handleApproveLoanRequest,
  handleRejectLoanRequest,
} from './loan-request.controller.js';

const router = Router();

// Public endpoint (can be called without auth, but auth is optional)
router.post(
  '/',
  optionalAuth, // Allow both authenticated and unauthenticated users
  handleCreateLoanRequest
);

// Member endpoint (get own requests)
router.get(
  '/',
  authenticate,
  handleGetLoanRequests
);

// Staff endpoints (approve/reject)
const moneyRoles = ['ADMIN', 'TELLER', 'MANAGER'];

router.post(
  '/:requestId/approve',
  authenticate,
  requireRoles(...moneyRoles),
  handleApproveLoanRequest
);

router.post(
  '/:requestId/reject',
  authenticate,
  requireRoles(...moneyRoles),
  handleRejectLoanRequest
);

export default router;

