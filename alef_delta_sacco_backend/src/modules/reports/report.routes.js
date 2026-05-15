import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { 
  handleSummary, 
  handleTransactionReport, 
  handleTellerDashboard, 
  handleCreditOfficerDashboard,
  handleDailyOperationalReport,
  handleMonthlyStatement,
  handleRegulatoryReport,
  handleLoanPortfolioReport,
  handleDelinquencyReport,
  handleCashFlowReport,
  handleMemberSummaryReport
} from './report.controller.js';

const router = Router();

router.get('/summary', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR', 'CREDIT_OFFICER', 'TELLER'), handleSummary);
router.get('/transactions', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleTransactionReport);
router.get('/teller-dashboard', authenticate, requireRoles('TELLER', 'ADMIN', 'MANAGER'), handleTellerDashboard);
router.get('/credit-officer-dashboard', authenticate, requireRoles('CREDIT_OFFICER', 'ADMIN', 'MANAGER'), handleCreditOfficerDashboard);

// New Report Routes
router.get('/daily-operational', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleDailyOperationalReport);
router.get('/monthly-statement', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleMonthlyStatement);
router.get('/regulatory', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleRegulatoryReport);

router.get('/loan-portfolio', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleLoanPortfolioReport);
router.get('/delinquency', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleDelinquencyReport);
router.get('/cash-flow', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleCashFlowReport);
router.get('/member-summary', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleMemberSummaryReport);

export default router;
