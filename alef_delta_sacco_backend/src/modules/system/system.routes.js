import express from 'express';
import * as systemController from './system.controller.js';
import { authenticate as requireAuth } from '../../core/middleware/auth.js';
import { requireRoles as requireRole } from '../../core/middleware/roles.js';

const router = express.Router();

router.get('/eod/status', requireAuth, requireRole('ADMIN'), systemController.getLastEodStatus);
router.post('/eod/run', requireAuth, requireRole('ADMIN'), systemController.runEndOfDay);
router.get('/eod/preview', requireAuth, requireRole('ADMIN'), systemController.getEodPreview);

// Penalty processing routes
router.post('/penalties/process', requireAuth, requireRole('ADMIN', 'MANAGER'), systemController.processPenalties);
router.get('/penalties/overdue', requireAuth, requireRole('ADMIN', 'MANAGER', 'CREDIT_OFFICER'), systemController.getOverdueLoans);

// Interest posting routes
router.post('/interest/process', requireAuth, requireRole('ADMIN'), systemController.processInterest);

// Member inactivity processing routes
router.post('/inactivity/process', requireAuth, requireRole('ADMIN'), systemController.processInactivity);

// System configuration routes
router.get('/config', requireAuth, requireRole('ADMIN'), systemController.getSystemConfig);
router.put('/config/:key', requireAuth, requireRole('ADMIN'), systemController.updateSystemConfig);

export default router;

