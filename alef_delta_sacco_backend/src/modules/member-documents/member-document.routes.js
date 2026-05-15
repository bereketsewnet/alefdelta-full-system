import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import {
  handleListMemberDocuments,
  handleGetMemberDocument,
  handleCreateMemberDocument,
  handleUpdateMemberDocument,
  handleDeleteMemberDocument,
  handleVerifyDocument
} from './member-document.controller.js';

const router = Router();
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER', 'AUDITOR'];

// Get all documents for a member (optionally filtered by type)
router.get('/member/:memberId', authenticate, requireRoles(...staffRoles), handleListMemberDocuments);

// Get single document
router.get('/:documentId', authenticate, requireRoles(...staffRoles), handleGetMemberDocument);

// Create document
router.post(
  '/member/:memberId',
  authenticate,
  requireRoles(...staffRoles),
  attachUploadContext('member-documents', (req) => req.params.memberId),
  upload.fields([
    { name: 'front_photo', maxCount: 10 }, // Allow multiple files
    { name: 'back_photo', maxCount: 10 }
  ]),
  handleCreateMemberDocument
);

// Update document
router.put(
  '/:documentId',
  authenticate,
  requireRoles(...staffRoles),
  async (req, res, next) => {
    // Get document to find member_id for upload context
    try {
      const { findMemberDocumentById } = await import('./member-document.repository.js');
      const document = await findMemberDocumentById(req.params.documentId);
      if (document) {
        req.uploadEntityId = document.member_id;
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  attachUploadContext('member-documents', (req) => req.uploadEntityId || 'general'),
  upload.fields([
    { name: 'front_photo', maxCount: 10 },
    { name: 'back_photo', maxCount: 10 }
  ]),
  handleUpdateMemberDocument
);

// Verify document (Manager/Admin only)
router.post(
  '/:documentId/verify',
  authenticate,
  requireRoles('ADMIN', 'MANAGER'),
  handleVerifyDocument
);

// Delete document
router.delete('/:documentId', authenticate, requireRoles(...staffRoles), handleDeleteMemberDocument);

export default router;

