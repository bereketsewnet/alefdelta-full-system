import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import {
  handleListLoans,
  handleGetLoan,
  handleCreateLoan,
  handleCheckEligibility,
  handlePreCheckEligibility,
  handleApproveLoan,
  handleGetSchedule,
  handleCalculateInstallment,
  handleAddGuarantor,
  handleAddCollateral,
  handleUpdateLoanStatus
  , handleGetApprovalStatus, handleInsuranceQuote
} from './loan.controller.js';

const router = Router();

// List loans (must be before /:id routes)
router.get('/', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER', 'BOARD_MEMBER'), handleListLoans);
// Get single loan
router.get('/:id', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER', 'BOARD_MEMBER'), handleGetLoan);
// Pre-check eligibility (before creating loan)
router.post(
  '/check-eligibility',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER'),
  handlePreCheckEligibility
);
// Create loan
router.post('/', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleCreateLoan);
router.post(
  '/:id/check-eligibility',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'BOARD_MEMBER'),
  handleCheckEligibility
);
router.post(
  '/:id/eligibility/refresh',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'BOARD_MEMBER'),
  handleCheckEligibility
);
router.post(
  '/:id/approve',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'BOARD_MEMBER'),
  handleApproveLoan
);
router.put(
  '/:id/status',
  authenticate,
  requireRoles('ADMIN', 'MANAGER', 'BOARD_MEMBER', 'CREDIT_OFFICER'),
  handleUpdateLoanStatus
);
router.get('/:id/schedule', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER', 'BOARD_MEMBER'), handleGetSchedule);
router.get('/:id/approval-status', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'BOARD_MEMBER'), handleGetApprovalStatus);
router.post('/calculate-installment', authenticate, handleCalculateInstallment);
router.post('/insurance-quote', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleInsuranceQuote);
router.post(
  '/:id/guarantors',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'),
  attachUploadContext('guarantors', (req) => req.params.id),
  upload.fields([
    { name: 'id_front', maxCount: 1 },
    { name: 'id_back', maxCount: 1 },
    { name: 'profile_photo', maxCount: 1 }
  ]),
  handleAddGuarantor
);
router.post(
  '/:id/collateral',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'),
  attachUploadContext('collateral', (req) => req.params.id),
  upload.fields([{ name: 'documents', maxCount: 10 }]), // Allow up to 10 documents
  handleAddCollateral
);

export default router;
