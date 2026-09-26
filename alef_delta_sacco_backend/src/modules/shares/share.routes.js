import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { idempotencyMiddleware } from '../../core/middleware/idempotency.js';
import { upload } from '../../core/middleware/upload.js';
import {
  handleApproveRequest,
  handleListRequests,
  handleMemberEntries,
  handleMemberSummary,
  handlePurchase,
  handleQuote,
  handleRedemption,
  handleRejectRequest
} from './share.controller.js';

const router = Router();
const moneyRoles = ['ADMIN', 'TELLER', 'MANAGER'];
const readRoles = [...moneyRoles, 'CREDIT_OFFICER', 'AUDITOR'];

function optionalProofUpload(req, res, next) {
  if (!req.is('multipart/form-data')) return next();
  req.uploadEntity = 'share-transactions';
  req.uploadEntityId = req.body?.account_id || 'general';
  return upload.fields([
    { name: 'receipt', maxCount: 1 },
    { name: 'company_receipt', maxCount: 1 },
    { name: 'bank_receipt', maxCount: 1 }
  ])(req, res, next);
}

router.get('/requests', authenticate, requireRoles(...moneyRoles, 'AUDITOR'), handleListRequests);
router.post('/requests/:requestId/approve', authenticate, requireRoles(...moneyRoles), handleApproveRequest);
router.post('/requests/:requestId/reject', authenticate, requireRoles(...moneyRoles), handleRejectRequest);
router.get('/members/:memberId/summary', authenticate, requireRoles(...readRoles), handleMemberSummary);
router.get('/members/:memberId/entries', authenticate, requireRoles(...readRoles), handleMemberEntries);
router.post('/quote', authenticate, requireRoles(...moneyRoles), handleQuote);
router.post('/purchases', authenticate, requireRoles(...moneyRoles), optionalProofUpload, idempotencyMiddleware('shares:purchase'), handlePurchase);
router.post('/redemptions', authenticate, requireRoles(...moneyRoles), optionalProofUpload, idempotencyMiddleware('shares:redemption'), handleRedemption);

export default router;
