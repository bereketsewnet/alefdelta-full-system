import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleVerifyCollateral, handleGetCollateralSummary, handleListCollateralForLoan, handleDeleteCollateral } from './collateral.controller.js';

const router = Router();

// Credit Officer can verify collateral
router.post('/:id/verify', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleVerifyCollateral);

// Get collateral summary for a loan
router.get('/loan/:loanId/summary', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER'), handleGetCollateralSummary);
// List all collateral for a loan
router.get('/loan/:loanId', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER'), handleListCollateralForLoan);
// Delete collateral
router.delete('/:id', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleDeleteCollateral);

export default router;

