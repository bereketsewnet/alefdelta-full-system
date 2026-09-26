import { Router } from 'express';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import { handleCreateMyRequest, handleMyEntries, handleMyPurchaseQuote, handleMyRequests, handleMySummary } from './share.controller.js';

const router = Router();

router.get('/summary', handleMySummary);
router.post('/quote', handleMyPurchaseQuote);
router.get('/entries', handleMyEntries);
router.get('/purchase-requests', handleMyRequests);
router.post('/purchase-requests', attachUploadContext('share-purchase-requests', (req) => req.user.memberId), upload.single('receipt'), handleCreateMyRequest);

export default router;
