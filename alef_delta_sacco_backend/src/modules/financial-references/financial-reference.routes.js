import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { handleCheckFinancialReference } from './financial-reference.controller.js';

const router = Router();

router.get('/check', authenticate, handleCheckFinancialReference);

export default router;

