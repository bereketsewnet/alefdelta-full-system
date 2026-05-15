import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import {
  handleMakePayment,
  handleGetPaymentSummary,
  handleGetRepaymentHistory,
  handleGetMemberRepayments,
  handleCheckAndNotifyPenalty,
  handleUpdateRepaymentReceipt
} from './repayment.controller.js';

const router = Router();

// Make a loan payment (Teller, Admin, Manager)
router.post(
  '/loans/:loanId/repayments',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'TELLER'),
  attachUploadContext('loan-repayments', (req) => req.params.loanId),
  // Support both legacy `receipt` and new `bank_receipt` + `company_receipt`
  upload.fields([
    { name: 'bank_receipt', maxCount: 1 },
    { name: 'company_receipt', maxCount: 1 },
    { name: 'receipt', maxCount: 1 },
  ]),
  handleMakePayment
);

// Get payment summary for a loan
router.get(
  '/loans/:loanId/repayments/summary',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER'),
  handleGetPaymentSummary
);

// Get repayment history for a loan
router.get(
  '/loans/:loanId/repayments',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER'),
  handleGetRepaymentHistory
);

// Get all repayments for a member
router.get(
  '/members/:memberId/repayments',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER'),
  handleGetMemberRepayments
);

// Check penalty and send SMS notification (manual trigger)
router.post(
  '/loans/:loanId/check-penalty',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'TELLER'),
  handleCheckAndNotifyPenalty
);

// Update repayment receipt info (staff only)
router.put(
  '/loan-repayments/:repaymentId',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'TELLER'),
  attachUploadContext('loan-repayments', (req) => req.params.repaymentId),
  upload.fields([
    { name: 'bank_receipt', maxCount: 1 },
    { name: 'company_receipt', maxCount: 1 },
  ]),
  handleUpdateRepaymentReceipt
);

export default router;


