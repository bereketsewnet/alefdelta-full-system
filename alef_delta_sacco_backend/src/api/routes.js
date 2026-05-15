import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import memberRoutes from '../modules/members/member.routes.js';
import accountRoutes from '../modules/accounts/account.routes.js';
import transactionRoutes from '../modules/transactions/transaction.routes.js';
import loanRoutes from '../modules/loans/loan.routes.js';
import loanRepaymentRoutes from '../modules/loan-repayments/repayment.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import collateralRoutes from '../modules/collateral/collateral.routes.js';
import guarantorRoutes from '../modules/guarantors/guarantor.routes.js';
import beneficiaryRoutes from '../modules/beneficiaries/beneficiary.routes.js';
import emergencyContactRoutes from '../modules/emergency-contacts/emergency-contact.routes.js';
import memberDocumentRoutes from '../modules/member-documents/member-document.routes.js';
import loanProductRoutes from '../modules/loan-products/loan-product.routes.js';
import accountProductRoutes from '../modules/account-products/account-product.routes.js';
import systemRoutes from '../modules/system/system.routes.js';
import clientRoutes from '../modules/client/client.routes.js';
import depositRequestRoutes from '../modules/deposit-requests/deposit-request.routes.js';
import loanRepaymentRequestRoutes from '../modules/loan-repayment-requests/loan-repayment-request.routes.js';
import memberRegistrationRequestRoutes from '../modules/member-registration-requests/member-registration-request.routes.js';
import partnerRequestRoutes from '../modules/partner-requests/partner-request.routes.js';
import loanRequestRoutes from '../modules/loan-requests/loan-request.routes.js';
import uploadRoutes from '../modules/uploads/upload.routes.js';
import { healthCheck } from '../core/db.js';

const router = Router();

router.get('/health', async (req, res) => {
  const healthy = await healthCheck();
  res.json({ status: healthy ? 'ok' : 'degraded' });
});

// Internal staff endpoints
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/members', memberRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/loans', loanRoutes);
router.use('/loan-products', loanProductRoutes);
router.use('/account-products', accountProductRoutes);
router.use('/collateral', collateralRoutes);
router.use('/guarantors', guarantorRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/emergency-contacts', emergencyContactRoutes);
router.use('/member-documents', memberDocumentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/system', systemRoutes);
router.use('/', loanRepaymentRoutes); // Loan repayments (mounted at root for /loans/:id/repayments paths)

// Client-facing endpoints (Telegram Mini App)
router.use('/client', clientRoutes);

// Deposit requests (accessible by both members and staff)
router.use('/deposit-requests', depositRequestRoutes);

// Loan repayment requests (accessible by both members and staff)
router.use('/loan-repayment-requests', loanRepaymentRequestRoutes);

// Member registration requests (self-registration with approval)
router.use('/member-registration-requests', memberRegistrationRequestRoutes);

// Partner requests (partnership and sponsorship)
router.use('/partner-requests', partnerRequestRoutes);

// Loan requests (public loan application requests)
router.use('/loan-requests', loanRequestRoutes);

// General file uploads (public endpoint for self-registration)
router.use('/uploads', uploadRoutes);

export default router;

