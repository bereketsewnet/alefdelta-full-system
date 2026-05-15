import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { idempotencyMiddleware } from '../../core/middleware/idempotency.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import { handleDeposit, handleWithdraw, handleGetTransactions, handleGetMemberTransactions, handleUpdateTransactionReceipt } from './transaction.controller.js';

const router = Router();

const moneyRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER'];

// Helper middleware to handle optional file upload with dynamic context
const optionalFileUpload = (req, res, next) => {
  // Only use multer if Content-Type is multipart/form-data
  if (req.is('multipart/form-data')) {
    // Set a temporary context, will be updated after body is parsed
    req.uploadEntity = 'transactions';
    req.uploadEntityId = 'general';
    
    // After multer processes, update context with account_id if available
    return upload.single('receipt')(req, res, () => {
      if (req.body?.account_id) {
        req.uploadEntityId = req.body.account_id;
      }
      next();
    });
  }
  next();
};

router.post(
  '/deposit',
  authenticate,
  requireRoles(...moneyRoles),
  optionalFileUpload,
  idempotencyMiddleware('transactions:deposit'),
  handleDeposit
);

router.post(
  '/withdraw',
  authenticate,
  requireRoles(...moneyRoles),
  optionalFileUpload,
  idempotencyMiddleware('transactions:withdraw'),
  handleWithdraw
);

router.get('/', authenticate, requireRoles(...moneyRoles, 'AUDITOR'), handleGetTransactions);
router.get('/member/:memberId', authenticate, requireRoles(...moneyRoles, 'AUDITOR'), handleGetMemberTransactions);

// Update transaction receipt photo
router.put(
  '/:txnId/receipt',
  authenticate,
  requireRoles(...moneyRoles),
  attachUploadContext('transactions', (req) => req.params.txnId),
  upload.single('receipt'),
  handleUpdateTransactionReceipt
);

export default router;

