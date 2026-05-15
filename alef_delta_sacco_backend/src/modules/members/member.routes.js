import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import {
  handleListMembers,
  handleGetMember,
  handleCreateMember,
  handleUpdateMember,
  handleUpload,
  handleAddBeneficiary,
  handleDeleteMember,
  handleActivateMember,
  handleSuspendMember,
  handleResetMemberPassword,
  handleReactivateMember,
  handleGetInactiveReport
} from './member.controller.js';

const router = Router();
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER', 'AUDITOR'];

router.get('/', authenticate, requireRoles(...staffRoles), handleListMembers);

router.get(
  '/:id',
  authenticate,
  (req, res, next) => {
    if (req.user.subjectType === 'MEMBER' && req.user.memberId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.subjectType === 'STAFF' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  },
  handleGetMember
);

router.post('/', authenticate, requireRoles('ADMIN', 'TELLER', 'MANAGER'), handleCreateMember);
router.put('/:id', authenticate, requireRoles('ADMIN', 'TELLER', 'MANAGER'), handleUpdateMember);
router.delete('/:id', authenticate, requireRoles('ADMIN'), handleDeleteMember);

// Manager-specific actions
router.post('/:id/activate', authenticate, requireRoles('ADMIN', 'MANAGER'), handleActivateMember);
router.post('/:id/suspend', authenticate, requireRoles('ADMIN', 'MANAGER'), handleSuspendMember);

// Admin-only: Reset member password
router.post('/:id/reset-password', authenticate, requireRoles('ADMIN'), handleResetMemberPassword);

router.post(
  '/:id/upload',
  authenticate,
  requireRoles(...staffRoles),
  attachUploadContext('members', (req) => req.params.id),
  upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 },
    { name: 'id_card', maxCount: 1 } // Legacy support
  ]),
  handleUpload
);

router.post(
  '/:id/beneficiaries',
  authenticate,
  requireRoles(...staffRoles),
  attachUploadContext('beneficiaries', (req) => req.params.id),
  upload.fields([
    { name: 'id_front', maxCount: 1 },
    { name: 'id_back', maxCount: 1 }
  ]),
  handleAddBeneficiary
);

// Member reactivation (Manager/Admin only)
router.post(
  '/:id/reactivate',
  authenticate,
  requireRoles('ADMIN', 'MANAGER'),
  handleReactivateMember
);

// Get inactive members report
router.get(
  '/inactive-report',
  authenticate,
  requireRoles('ADMIN', 'MANAGER'),
  handleGetInactiveReport
);

export default router;

