import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import {
  handleGetProfile,
  handleGetAccounts,
  handleGetAccountTransactions,
  handleGetTransactions,
  handleGetLoans,
  handleGetLoanSchedule
} from './client.controller.js';
import depositRequestRoutes from '../deposit-requests/deposit-request.routes.js';
import notificationRoutes from '../notifications/notification.routes.js';

const router = Router();

// All client endpoints require member authentication
const requireMember = (req, res, next) => {
  if (req.user.subjectType !== 'MEMBER') {
    return res.status(403).json({ message: 'Member access only' });
  }
  next();
};

// Client profile and dashboard
router.get('/me', authenticate, requireMember, handleGetProfile);

// Client accounts
router.get('/accounts', authenticate, requireMember, handleGetAccounts);
router.get('/accounts/:accountId/transactions', authenticate, requireMember, handleGetAccountTransactions);
router.get('/transactions', authenticate, requireMember, handleGetTransactions);

// Client loans
router.get('/loans', authenticate, requireMember, handleGetLoans);
router.get('/loans/:loanId/schedule', authenticate, requireMember, handleGetLoanSchedule);

// Client notifications
router.use('/notifications', authenticate, requireMember, notificationRoutes);

// Deposit requests
router.use('/deposit-requests', authenticate, requireMember, depositRequestRoutes);

export default router;

