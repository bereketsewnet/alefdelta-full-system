import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import * as controller from './profit-distribution.controller.js';

const router = Router();
const readers = ['ADMIN', 'MANAGER', 'AUDITOR', 'BOARD_MEMBER'];

router.get('/master-account/summary', authenticate, requireRoles(...readers), controller.handleMasterSummary);
router.get('/master-account/ledger', authenticate, requireRoles(...readers), controller.handleMasterLedger);
router.post('/master-account/adjustments', authenticate, requireRoles('ADMIN'), controller.handleManualAdjustment);
router.get('/master-account/reconciliation/preview', authenticate, requireRoles('ADMIN'), controller.handleReconciliationPreview);
router.post('/master-account/reconciliation/import', authenticate, requireRoles('ADMIN'), controller.handleReconciliationImport);
router.get('/policies/current', authenticate, requireRoles(...readers), controller.handleCurrentPolicy);
router.get('/policies', authenticate, requireRoles(...readers), controller.handlePolicies);
router.post('/policies', authenticate, requireRoles('ADMIN'), controller.handleCreatePolicy);
router.post('/policies/:id/activate', authenticate, requireRoles('ADMIN'), controller.handleActivatePolicy);
router.get('/', authenticate, requireRoles(...readers), controller.handleList);
router.post('/', authenticate, requireRoles('ADMIN'), controller.handleGenerate);
router.get('/:id', authenticate, requireRoles(...readers), controller.handleGet);
router.get('/:id/payout-validation', authenticate, requireRoles(...readers), controller.handlePayoutValidation);
router.put('/:id/members/:memberId/share-override', authenticate, requireRoles('ADMIN'), controller.handleOverrideShares);
router.post('/:id/submit', authenticate, requireRoles('ADMIN'), controller.handleSubmit);
router.post('/:id/vote', authenticate, requireRoles('BOARD_MEMBER'), controller.handleVote);
router.post('/:id/votes/:voteId/resolve', authenticate, requireRoles('ADMIN'), controller.handleResolve);
router.post('/:id/void', authenticate, requireRoles('ADMIN'), controller.handleVoid);
router.post('/:id/payout', authenticate, requireRoles('ADMIN'), controller.handlePayout);

export default router;
