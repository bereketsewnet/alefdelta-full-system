import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import { findBeneficiaryById } from './beneficiary.repository.js';
import {
  handleListBeneficiaries,
  handleGetBeneficiary,
  handleCreateBeneficiary,
  handleUpdateBeneficiary,
  handleDeleteBeneficiary
} from './beneficiary.controller.js';

const router = Router();
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER', 'AUDITOR'];

// Get all beneficiaries for a member
router.get('/member/:memberId', authenticate, requireRoles(...staffRoles), handleListBeneficiaries);

// Get single beneficiary
router.get('/:beneficiaryId', authenticate, requireRoles(...staffRoles), handleGetBeneficiary);

// Create beneficiary
router.post(
  '/member/:memberId',
  authenticate,
  requireRoles(...staffRoles),
  attachUploadContext('beneficiaries', (req) => req.params.memberId),
  upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 }
  ]),
  handleCreateBeneficiary
);

// Update beneficiary - need to get member_id from beneficiary first
router.put(
  '/:beneficiaryId',
  authenticate,
  requireRoles(...staffRoles),
  async (req, res, next) => {
    // Get beneficiary to find member_id for upload context
    try {
      const beneficiary = await findBeneficiaryById(req.params.beneficiaryId);
      if (beneficiary) {
        req.uploadEntityId = beneficiary.member_id;
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  attachUploadContext('beneficiaries', (req) => req.uploadEntityId || 'general'),
  upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 }
  ]),
  handleUpdateBeneficiary
);

// Delete beneficiary
router.delete('/:beneficiaryId', authenticate, requireRoles(...staffRoles), handleDeleteBeneficiary);

export default router;

