import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import httpError from '../../core/utils/httpError.js';
import { findMemberById } from '../members/member.repository.js';
import {
  findLoanProductByCode,
  createLoanApplication,
  findLoanById,
  updateLoan,
  listLoans
} from './loan.repository.js';
import { withTransaction, query } from '../../core/db.js';
import { findAccountById } from '../accounts/account.repository.js';
import { updateAccountBalance } from '../accounts/account.service.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { addGuarantor } from '../guarantors/guarantor.repository.js';
import { addCollateral } from '../collateral/collateral.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import { initializeLoanBalance } from '../loan-repayments/repayment.service.js';
import {
  calculateInstallment,
  runGatekeeper,
  buildSchedule as buildScheduleHelper
} from './gatekeeper.js';

export async function createLoan(payload) {
  const member = await findMemberById(payload.member_id);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const product = await findLoanProductByCode(payload.product_code);
  if (!product) {
    throw httpError(400, 'Loan product not found');
  }
  const gatekeeperResult = runGatekeeper(member, payload, product);
  const loanId = uuid();
  await createLoanApplication({
    loan_id: loanId,
    member_id: payload.member_id,
    product_code: payload.product_code,
    applied_amount: payload.applied_amount,
    approved_amount: null,
    term_months: payload.term_months,
    interest_rate: payload.interest_rate || product.interest_rate,
    interest_type: payload.interest_type || product.interest_type,
    purpose_description: payload.purpose_description,
    repayment_frequency: payload.repayment_frequency || 'MONTHLY',
    workflow_status: gatekeeperResult.passed ? 'UNDER_REVIEW' : 'PENDING'
  });
  await updateLoan(loanId, { eligibility_snapshot: JSON.stringify(gatekeeperResult) });
  return findLoanById(loanId);
}

export async function checkLoanEligibility(loanId) {
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  const member = await findMemberById(loan.member_id);
  const product = await findLoanProductByCode(loan.product_code);
  const result = runGatekeeper(
    member,
    {
      applied_amount: loan.applied_amount,
      interest_rate: loan.interest_rate,
      interest_type: loan.interest_type,
      term_months: loan.term_months
    },
    product
  );
  await updateLoan(loanId, { eligibility_snapshot: JSON.stringify(result) });
  return result;
}

export async function approveLoan(loanId, payload, actor) {
  if (!['ADMIN', 'MANAGER'].includes(actor.role)) {
    throw httpError(403, 'Only MANAGER or ADMIN can approve loans');
  }
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  if (loan.workflow_status === 'APPROVED') {
    throw httpError(400, 'Loan already approved');
  }
  return withTransaction(async (connection) => {
    if (payload.lien_amount && payload.lien_account_id) {
      const [rows] = await connection.query('SELECT * FROM accounts WHERE account_id = ?', [
        payload.lien_account_id
      ]);
      const account = rows[0];
      if (!account) {
        throw httpError(404, 'Lien account not found');
      }
      await updateAccountBalance(
        account.account_id,
        account.version,
        { balance: account.balance, lien_amount: Number(account.lien_amount || 0) + Number(payload.lien_amount) },
        connection
      );
    }
    await updateLoan(
      loanId,
      {
        workflow_status: 'APPROVED',
        approved_amount: payload.approved_amount || loan.applied_amount,
        interest_rate: payload.interest_rate || loan.interest_rate,
        term_months: payload.term_months || loan.term_months,
        disbursement_date: payload.disbursement_date || dayjs().format('YYYY-MM-DD'),
        next_payment_date: dayjs(payload.disbursement_date || dayjs()).add(1, 'month').format('YYYY-MM-DD')
      },
      connection
    );
    await insertAuditLog({
      userId: actor.userId,
      action: 'APPROVE_LOAN',
      entity: 'loan_applications',
      entityId: loanId,
      metadata: payload
    });
    
    const approvedLoan = await findLoanById(loanId, connection);
    
    // Initialize loan balance for repayment tracking (inside same transaction)
    await initializeLoanBalance(loanId, connection);
    
    // Create notification (fire-and-forget for faster response)
    if (approvedLoan.member_id) {
      const { NotificationHelpers } = await import('../notifications/notification.service.js');
      NotificationHelpers.loanApproved(
        approvedLoan.member_id,
        loanId,
        approvedLoan.approved_amount || approvedLoan.applied_amount,
        approvedLoan.product_code
      ).catch(err => {
        console.error('Failed to create loan approval notification:', err);
      });
    }
    
    return approvedLoan;
  });
}

export function buildSchedule({ loan, startDate }) {
  return buildScheduleHelper(loan, startDate);
}

export async function updateLoanStatus(loanId, status, actor) {
  if (!['ADMIN', 'MANAGER'].includes(actor.role)) {
    throw httpError(403, 'Only MANAGER or ADMIN can update loan status');
  }
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  
  // For APPROVED status, use the approveLoan function only if not already approved
  if (status === 'APPROVED' && loan.workflow_status !== 'APPROVED') {
    return approveLoan(loanId, {
      approved_amount: loan.applied_amount,
      term_months: loan.term_months,
      interest_rate: loan.interest_rate
    }, actor);
  }
  
  // For other statuses or if already approved, just update the workflow_status
  await updateLoan(loanId, { workflow_status: status });
  await insertAuditLog({
    userId: actor.userId,
    action: 'UPDATE_LOAN_STATUS',
    entity: 'loan_applications',
    entityId: loanId,
    metadata: { status, previous_status: loan.workflow_status }
  });
  
  const updatedLoan = await findLoanById(loanId);
  
  // Create notification for rejection (fire-and-forget for faster response)
  if (status === 'REJECTED' && updatedLoan.member_id) {
    const { NotificationHelpers } = await import('../notifications/notification.service.js');
    NotificationHelpers.loanRejected(
      updatedLoan.member_id,
      loanId,
      null // Reason can be added to metadata if needed
    ).catch(err => {
      console.error('Failed to create loan rejection notification:', err);
    });
  }
  
  return updatedLoan;
}

export { calculateInstallment } from './gatekeeper.js';

export async function getLoanOrFail(loanId) {
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  return loan;
}

export async function addLoanGuarantor(loanId, payload, files) {
  const loan = await getLoanOrFail(loanId);
  
  // Get existing guarantors count to calculate duty value if not provided
  const existingGuarantors = await query('SELECT COUNT(*) as count FROM guarantors WHERE loan_id = ?', [loanId]);
  const guarantorCount = Number(existingGuarantors[0]?.count || 0) + 1; // +1 for the new one
  
  // Calculate duty value: if not provided, divide loan amount by total guarantors
  let dutyValue = payload.duty_value ? Number(payload.duty_value) : null;
  if (!dutyValue && loan.applied_amount) {
    dutyValue = Number(loan.applied_amount) / guarantorCount;
  }
  
  // If guaranteed_amount is not provided, use duty_value
  const guaranteedAmount = payload.guaranteed_amount ? Number(payload.guaranteed_amount) : dutyValue;
  
  await addGuarantor({
    guarantor_id: uuid(),
    loan_id: loanId,
    full_name: payload.full_name,
    phone: payload.phone,
    age: payload.age ? Number(payload.age) : null,
    relationship: payload.relationship || null,
    address: payload.address || null,
    guaranteed_amount: guaranteedAmount,
    id_front_url: files?.id_front?.[0] ? toPublicUrl(files.id_front[0].path) : null,
    id_back_url: files?.id_back?.[0] ? toPublicUrl(files.id_back[0].path) : null,
    profile_photo_url: files?.profile_photo?.[0] ? toPublicUrl(files.profile_photo[0].path) : null,
    duty_value: dutyValue
  });
  return { success: true };
}

export async function addLoanCollateral(loanId, payload, files) {
  await getLoanOrFail(loanId);
  
  // Process multiple documents
  const documents = [];
  if (files?.documents && files.documents.length > 0) {
    for (const file of files.documents) {
      documents.push({
        url: toPublicUrl(file.path),
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploaded_at: new Date().toISOString()
      });
    }
  }
  
  // Documents are required - throw error if none provided
  if (documents.length === 0) {
    throw httpError(400, 'At least one document is required for collateral');
  }
  
  await addCollateral({
    collateral_id: uuid(),
    loan_id: loanId,
    type: payload.type,
    description: payload.description,
    estimated_value: payload.estimated_value,
    documents: JSON.stringify(documents)
  });
  return { success: true };
}

export async function getLoans(filters = {}) {
  return listLoans(filters);
}

