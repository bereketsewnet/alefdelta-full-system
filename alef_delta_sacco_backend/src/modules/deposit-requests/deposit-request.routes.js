import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { attachUploadContext, upload } from '../../core/middleware/upload.js';
import {
  handleCreateDepositRequest,
  handleGetDepositRequests,
  handleApproveDepositRequest,
  handleRejectDepositRequest,
} from './deposit-request.controller.js';

const router = Router();

// Member endpoints
router.post(
  '/',
  authenticate,
  attachUploadContext('deposit-requests', (req) => req.user.memberId),
  upload.single('receipt'),
  handleCreateDepositRequest
);

router.get(
  '/',
  authenticate,
  handleGetDepositRequests
);

// Staff endpoints (approve/reject)
const moneyRoles = ['ADMIN', 'TELLER', 'MANAGER'];

router.post(
  '/:requestId/approve',
  authenticate,
  requireRoles(...moneyRoles),
  handleApproveDepositRequest
);

router.post(
  '/:requestId/reject',
  authenticate,
  requireRoles(...moneyRoles),
  handleRejectDepositRequest
);

export default router;

