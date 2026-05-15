import { Router } from 'express';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import { handleUpload, handleMultipleUpload } from './upload.controller.js';

const router = Router();

// Set upload context for general uploads
const generalUploadContext = attachUploadContext('misc', () => 'general');

// Single file upload
router.post(
  '/',
  generalUploadContext,
  upload.single('file'),
  handleUpload
);

// Multiple files upload
router.post(
  '/multiple',
  generalUploadContext,
  upload.array('files', 10), // Max 10 files
  handleMultipleUpload
);

export default router;

