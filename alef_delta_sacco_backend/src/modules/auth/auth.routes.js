import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import {
  handleLogin,
  handleRefresh,
  handleRequestOtp,
  handleVerifyOtp,
  handleChangePassword,
  handleMe
} from './auth.controller.js';

const router = Router();

router.post('/login', handleLogin);
router.post('/refresh', handleRefresh);
router.post('/request-otp', handleRequestOtp);
router.post('/verify-otp', handleVerifyOtp);
router.post('/change-password', authenticate, handleChangePassword);
router.get('/me', authenticate, handleMe);

export default router;

