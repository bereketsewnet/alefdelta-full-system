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
import { findAccountById, listEligibilityAccountsByMember } from '../accounts/account.repository.js';
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
import { buildDecliningSchedule } from './amortization.js';
import { replaceLoanSchedule, listLoanSchedule } from './amortization.repository.js';
import { snapshotBoardVoters, recordVote, getApprovalStatus, resetApprovalVotes } from './approval.repository.js';
import { quoteLoanInsurance } from './insurance.js';
import { findTierById } from '../loan-products/loan-tier.repository.js';
import { createEligibilityEvaluation, findEligibilityEvaluation, listLoanEligibilityEvaluations } from './eligibility.repository.js';
import { postMasterEntry } from '../profit-distributions/master-ledger.js';
import { addisAbabaDate, centsToEtb, etbToCents } from '../profit-distributions/money.js';

export function calculateUpfrontLoanFees({ principal, serviceCharge, insurancePremium, paymentMethod }) {
  if (!['DEDUCT_FROM_LOAN', 'OUT_OF_POCKET'].includes(paymentMethod)) {
    throw httpError(400, 'Select how the service charge and insurance fee will be paid');
  }
  const principalCents = etbToCents(principal);
  const serviceCents = etbToCents(serviceCharge || 0);
  const insuranceCents = etbToCents(insurancePremium || 0);
  const totalFeeCents = serviceCents + insuranceCents;
  const netCents = paymentMethod === 'DEDUCT_FROM_LOAN'
    ? principalCents - totalFeeCents
    : principalCents;
  if (principalCents <= 0n) throw httpError(400, 'Loan amount must be greater than zero');
  if (netCents <= 0n) throw httpError(400, 'Upfront fees must be less than the approved loan amount');
  return {
    grossDisbursement: centsToEtb(principalCents),
    serviceCharge: centsToEtb(serviceCents),
    insurancePremium: centsToEtb(insuranceCents),
    totalUpfrontFees: centsToEtb(totalFeeCents),
    netDisbursement: centsToEtb(netCents)
  };
}

async function collectUpfrontLoanFees(connection, loan, approvedAmount, actor) {
  if (loan.fee_collection_status === 'COLLECTED') return loan;
  if (!loan.fee_payment_method) throw httpError(409, 'Loan fee payment method is missing');
  if (loan.fee_payment_method === 'OUT_OF_POCKET' && !loan.fee_receipt_url) {
    throw httpError(409, 'An out-of-pocket fee receipt must be uploaded before disbursement');
  }
  const fees = calculateUpfrontLoanFees({
    principal: approvedAmount,
    serviceCharge: loan.service_charge_amount,
    insurancePremium: loan.insurance_premium,
    paymentMethod: loan.fee_payment_method
  });
  let serviceLedgerId = loan.service_charge_ledger_id || null;
  let insuranceLedgerId = loan.insurance_held_ledger_id || null;
  if (etbToCents(fees.serviceCharge) > 0n) {
    const result = await postMasterEntry(connection, {
      entryDate: addisAbabaDate(), direction: 'INFLOW', entryType: 'SERVICE_CHARGE_INFLOW',
      amount: fees.serviceCharge, affectsProfit: true, sourceType: 'LOAN_APPLICATION',
      sourceId: loan.loan_id, sourceComponent: 'SERVICE_CHARGE', performedBy: actor.userId,
      description: `Service charge collected at disbursement for loan ${loan.loan_id}`,
      idempotencyKey: `LOAN_SERVICE_CHARGE:${loan.loan_id}`
    });
    serviceLedgerId = result.entry.ledger_id;
  }
  if (etbToCents(fees.insurancePremium) > 0n) {
    const result = await postMasterEntry(connection, {
      entryDate: addisAbabaDate(), direction: 'INFLOW', entryType: 'INSURANCE_HELD',
      amount: fees.insurancePremium, affectsProfit: false, sourceType: 'LOAN_APPLICATION',
      sourceId: loan.loan_id, sourceComponent: 'INSURANCE_HELD', performedBy: actor.userId,
      description: `Insurance premium held in escrow for loan ${loan.loan_id}`,
      idempotencyKey: `LOAN_INSURANCE_HELD:${loan.loan_id}`
    });
    insuranceLedgerId = result.entry.ledger_id;
  }
  await updateLoan(loan.loan_id, {
    gross_disbursement_amount: fees.grossDisbursement,
    total_upfront_fee_amount: fees.totalUpfrontFees,
    net_disbursement_amount: fees.netDisbursement,
    fee_collection_status: 'COLLECTED',
    fees_collected_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    fees_collected_by: actor.userId,
    service_charge_ledger_id: serviceLedgerId,
    insurance_escrow_status: etbToCents(fees.insurancePremium) > 0n ? 'HELD' : 'NOT_APPLICABLE',
    insurance_held_ledger_id: insuranceLedgerId
  }, connection);
  return findLoanById(loan.loan_id, connection);
}

function firstDueDate(disbursementDate, frequency) {
  if (frequency === 'WEEKLY') return dayjs(disbursementDate).add(1, 'week').format('YYYY-MM-DD');
  if (frequency === 'QUARTERLY') return dayjs(disbursementDate).add(3, 'month').format('YYYY-MM-DD');
  return dayjs(disbursementDate).add(1, 'month').format('YYYY-MM-DD');
}

async function evaluateLoanPayload(payload) {
  const member = await findMemberById(payload.member_id);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const product = await findLoanProductByCode(payload.product_code);
  if (!product) {
    throw httpError(400, 'Loan product not found');
  }
  if (!Boolean(product.is_active)) {
    throw httpError(400, 'Loan product is inactive');
  }
  const tier = await findTierById(payload.selected_tier_id);
  if (!tier || tier.product_code !== payload.product_code) {
    throw httpError(400, 'Selected tier is not active or does not belong to this loan product');
  }
  const memberAccounts = await listEligibilityAccountsByMember(payload.member_id);
  return { member, product, tier, result: runGatekeeper(member, payload, product, tier, memberAccounts) };
}

export async function createLoan(payload, actor) {
  const { member, product, tier, result: gatekeeperResult } = await evaluateLoanPayload(payload);
  if (!gatekeeperResult.passed && !payload.exception_reason?.trim()) {
    throw httpError(400, 'An exception reason is required when eligibility checks fail', gatekeeperResult.checks);
  }
  const loanId = uuid();
  const configRows = await query("SELECT config_key, config_value FROM system_config WHERE config_key IN ('loan_insurance_enabled')");
  const insuranceConfig = Object.fromEntries(configRows.map((row) => [row.config_key, row.config_value]));
  const borrowerAge = Number(payload.borrower_age ?? member.age);
  const insurance = await quoteLoanInsurance({ age: borrowerAge, termMonths: payload.term_months, maritalStatus: member.marital_status, principal: payload.applied_amount, enabled: insuranceConfig.loan_insurance_enabled !== 'false' });
  const serviceChargeMode = product.service_charge_mode || 'PERCENT';
  const serviceChargeAmount = serviceChargeMode === 'FIXED'
    ? Number(product.service_charge_fixed_amount || 0)
    : Number(((Number(payload.applied_amount) * Number(product.service_charge_rate || 0)) / 100).toFixed(2));
  if (payload.fee_payment_method === 'OUT_OF_POCKET' && !payload.fee_receipt_url) {
    throw httpError(400, 'Receipt upload is required when fees are paid out-of-pocket');
  }
  const feeQuote = calculateUpfrontLoanFees({
    principal: payload.applied_amount,
    serviceCharge: serviceChargeAmount,
    insurancePremium: insurance.premium,
    paymentMethod: payload.fee_payment_method
  });
  return withTransaction(async (connection) => {
    await createLoanApplication({
      loan_id: loanId,
      member_id: payload.member_id,
      product_code: payload.product_code,
      selected_tier_id: tier.tier_id,
      applied_amount: payload.applied_amount,
      approved_amount: null,
      term_months: payload.term_months,
      interest_rate: tier.interest_rate,
      interest_type: 'DECLINING',
      penalty_rate: product.penalty_rate || 2, penalty_mode: product.penalty_mode || 'PERCENT', penalty_fixed_amount: product.penalty_fixed_amount || 0, penalty_grace_days: product.penalty_grace_days || 0, penalty_escalation_enabled: product.penalty_escalation_enabled || false, penalty_escalation_value: product.penalty_escalation_value || 0,
      service_charge_mode: serviceChargeMode, service_charge_rate: product.service_charge_rate || 0, service_charge_fixed_amount: product.service_charge_fixed_amount || 0, service_charge_amount: serviceChargeAmount,
      borrower_age: borrowerAge, insurance_enabled: insurance.enabled, insurance_ceiling_rate: insurance.ceilingRate, insurance_rate: insurance.rate, insurance_premium: insurance.premium, insurance_renewal_date: insurance.annualRenewalRequired ? dayjs().add(1, 'year').format('YYYY-MM-DD') : null,
      fee_payment_method: payload.fee_payment_method,
      fee_receipt_number: payload.fee_receipt_number || null,
      fee_receipt_url: payload.fee_receipt_url || null,
      gross_disbursement_amount: feeQuote.grossDisbursement,
      total_upfront_fee_amount: feeQuote.totalUpfrontFees,
      net_disbursement_amount: feeQuote.netDisbursement,
      fee_collection_status: 'PENDING',
      insurance_escrow_status: etbToCents(feeQuote.insurancePremium) > 0n ? 'PENDING' : 'NOT_APPLICABLE',
      purpose_description: payload.purpose_description,
      repayment_frequency: payload.repayment_frequency || 'MONTHLY',
      workflow_status: 'UNDER_REVIEW'
    }, connection);
    const evaluationId = await createEligibilityEvaluation({ loanId, source: 'SUBMISSION', result: gatekeeperResult, actorUserId: actor.userId }, connection);
    await updateLoan(loanId, {
      eligibility_snapshot: JSON.stringify(gatekeeperResult),
      tier_policy_snapshot: JSON.stringify(tier),
      eligibility_checked_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      latest_eligibility_evaluation_id: evaluationId,
      eligibility_exception_required: gatekeeperResult.passed ? 0 : 1,
      officer_exception_reason: gatekeeperResult.passed ? null : payload.exception_reason.trim(),
      created_by_user_id: actor.userId
    }, connection);
    await snapshotBoardVoters(loanId, connection);
    await insertAuditLog({
      userId: actor.userId,
      action: gatekeeperResult.passed ? 'CREATE_LOAN' : 'CREATE_LOAN_EXCEPTION',
      entity: 'loan_applications',
      entityId: loanId,
      metadata: { evaluation_id: evaluationId, exception_reason: payload.exception_reason || null, failed_checks: gatekeeperResult.checks.filter((check) => !check.pass).map((check) => check.name), fee_payment_method: payload.fee_payment_method, fee_quote: feeQuote },
      connection
    });
    return findLoanById(loanId, connection);
  });
}

export async function preCheckEligibility(payload) {
  return (await evaluateLoanPayload(payload)).result;
}

export async function checkLoanEligibility(loanId, actor) {
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  if (!['PENDING', 'UNDER_REVIEW'].includes(loan.workflow_status)) {
    throw httpError(400, 'Eligibility can only be refreshed while a loan is pending review');
  }
  if (!loan.selected_tier_id) throw httpError(400, 'This historical loan does not have a selected tier');
  const { result } = await evaluateLoanPayload({
      member_id: loan.member_id,
      product_code: loan.product_code,
      selected_tier_id: loan.selected_tier_id,
      applied_amount: loan.applied_amount,
      interest_rate: loan.interest_rate,
      interest_type: loan.interest_type,
      term_months: loan.term_months
  });
  return withTransaction(async (connection) => {
    const evaluationId = await createEligibilityEvaluation({ loanId, source: 'MANUAL_REFRESH', result, actorUserId: actor.userId }, connection);
    await updateLoan(loanId, {
      eligibility_snapshot: JSON.stringify(result),
      eligibility_checked_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      latest_eligibility_evaluation_id: evaluationId,
      eligibility_exception_required: result.passed ? 0 : 1
    }, connection);
    await resetApprovalVotes(loanId, connection);
    await insertAuditLog({ userId: actor.userId, action: 'REFRESH_LOAN_ELIGIBILITY', entity: 'loan_applications', entityId: loanId, metadata: { evaluation_id: evaluationId, passed: result.passed } });
    return { ...result, evaluation_id: evaluationId };
  });
}

export async function approveLoan(loanId, payload, actor) {
  if (!['ADMIN', 'MANAGER', 'BOARD_MEMBER'].includes(actor.role)) {
    throw httpError(403, 'Only MANAGER, ADMIN, or BOARD_MEMBER can approve loans');
  }
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  if (loan.workflow_status === 'APPROVED') {
    throw httpError(400, 'Loan already approved');
  }
  if (loan.workflow_status === 'REJECTED') throw httpError(400, 'Rejected loans cannot be approved');
  if (Number(payload.approved_amount) !== Number(loan.applied_amount) ||
      Number(payload.term_months) !== Number(loan.term_months) ||
      Number(payload.interest_rate) !== Number(loan.interest_rate)) {
    throw httpError(400, 'Amount, term, or rate changed. Update the application and refresh eligibility before voting.');
  }
  return withTransaction(async (connection) => {
    const [lockedRows] = await connection.query('SELECT * FROM loan_applications WHERE loan_id = ? FOR UPDATE', [loanId]);
    const lockedLoan = lockedRows[0];
    if (!lockedLoan) throw httpError(404, 'Loan not found');
    if (lockedLoan.workflow_status === 'APPROVED') return lockedLoan;
    const evaluation = await findEligibilityEvaluation(lockedLoan.latest_eligibility_evaluation_id, connection);
    if (!evaluation) throw httpError(400, 'Run eligibility validation before approving this loan');
    if (!evaluation.passed && (!payload.override_acknowledged || !payload.override_reason?.trim())) {
      throw httpError(400, 'Explicit exception acknowledgement and reason are required for failed eligibility');
    }
    await recordVote(loanId, actor, 'APPROVED', payload.audit_note || 'Approved', connection, {
      evaluationId: evaluation.evaluation_id,
      acknowledged: !evaluation.passed && payload.override_acknowledged,
      reason: !evaluation.passed ? payload.override_reason.trim() : null
    });
    const approvals = await getApprovalStatus(loanId, connection);
    if (approvals.rejected) throw httpError(400, 'Loan has already been rejected');
    const approvedVotes = approvals.votes.filter((vote) => vote.decision === 'APPROVED');
    const votesMatchEvaluation = approvedVotes.every((vote) => vote.eligibility_evaluation_id === evaluation.evaluation_id);
    const overrideComplete = evaluation.passed || approvedVotes.every((vote) => vote.override_acknowledged && vote.override_reason);
    if (!votesMatchEvaluation || !overrideComplete) {
      throw httpError(400, 'All approvals must acknowledge the same current eligibility evaluation');
    }
    if (!approvals.manager_approved || approvals.board_approved < approvals.board_required) {
      await insertAuditLog({ userId: actor.userId, action: 'LOAN_APPROVAL_VOTE', entity: 'loan_applications', entityId: loanId, metadata: approvals, connection });
      return { ...(await findLoanById(loanId, connection)), approval_status: approvals };
    }
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
    const disbursementDate = payload.disbursement_date || dayjs().format('YYYY-MM-DD');
    const repaymentFrequency = lockedLoan.repayment_frequency || 'MONTHLY';
    const dueDate = firstDueDate(disbursementDate, repaymentFrequency);
    await collectUpfrontLoanFees(connection, lockedLoan, payload.approved_amount || lockedLoan.applied_amount, actor);
    await updateLoan(
      loanId,
      {
        workflow_status: 'APPROVED',
        approved_amount: payload.approved_amount || lockedLoan.applied_amount,
        interest_rate: payload.interest_rate || lockedLoan.interest_rate,
        term_months: payload.term_months || lockedLoan.term_months,
        interest_type: 'DECLINING',
        disbursement_date: disbursementDate,
        next_payment_date: dueDate
      },
      connection
    );
    await insertAuditLog({
      userId: actor.userId,
      action: 'APPROVE_LOAN',
      entity: 'loan_applications',
      entityId: loanId,
      metadata: payload,
      connection
    });
    
    const approvedLoan = await findLoanById(loanId, connection);
    const schedule = buildDecliningSchedule({
      principal: approvedLoan.approved_amount || approvedLoan.applied_amount,
      annualRate: approvedLoan.interest_rate,
      termMonths: approvedLoan.term_months,
      frequency: repaymentFrequency,
      firstDueDate: dueDate
    });
    await replaceLoanSchedule(loanId, schedule, connection);
    
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

export async function closeLoan(loanId, payload, actor) {
  if (!['ADMIN', 'MANAGER'].includes(actor.role)) throw httpError(403, 'Only Admin or Manager can close a fully repaid loan');
  return withTransaction(async (connection) => {
    const [lockedRows] = await connection.query('SELECT * FROM loan_applications WHERE loan_id = ? FOR UPDATE', [loanId]);
    const loan = lockedRows[0];
    if (!loan) throw httpError(404, 'Loan not found');
    if (loan.closure_idempotency_key === payload.idempotency_key || loan.workflow_status === 'CLOSED') return loan;
    if (loan.workflow_status !== 'APPROVED' || !Boolean(loan.is_fully_paid) || etbToCents(loan.outstanding_balance || 0) !== 0n || etbToCents(loan.penalty_due || 0) !== 0n) {
      throw httpError(409, 'Loan can be closed only after principal and penalties are fully paid');
    }
    if (loan.insurance_escrow_status === 'PENDING') throw httpError(409, 'Insurance fee has not been collected for this loan');
    let resolutionLedgerId = loan.insurance_resolution_ledger_id || null;
    const premiumCents = etbToCents(loan.insurance_premium || 0);
    let escrowStatus = loan.insurance_escrow_status;
    if (loan.insurance_escrow_status === 'HELD' && premiumCents > 0n) {
      if (payload.insurance_claim_made) {
        const result = await postMasterEntry(connection, {
          entryDate: addisAbabaDate(), direction: 'OUTFLOW', entryType: 'INSURANCE_CLAIM_UTILIZED',
          amount: centsToEtb(premiumCents), affectsProfit: false, sourceType: 'LOAN_CLOSURE',
          sourceId: loanId, sourceComponent: 'INSURANCE_CLAIM', performedBy: actor.userId,
          description: `Insurance escrow utilized for claim on loan ${loanId}: ${payload.reason.trim()}`,
          idempotencyKey: `LOAN_INSURANCE_CLAIM:${loanId}`
        });
        resolutionLedgerId = result.entry.ledger_id;
        escrowStatus = 'UTILIZED';
      } else {
        const result = await postMasterEntry(connection, {
          entryDate: addisAbabaDate(), direction: 'INFLOW', entryType: 'UNUTILIZED_INSURANCE_REVENUE',
          amount: centsToEtb(premiumCents), affectsProfit: true, affectsBalance: false,
          sourceType: 'LOAN_CLOSURE', sourceId: loanId, sourceComponent: 'INSURANCE_RECOGNITION',
          performedBy: actor.userId, description: `Unused insurance escrow recognized as revenue for loan ${loanId}`,
          idempotencyKey: `LOAN_INSURANCE_RECOGNIZED:${loanId}`
        });
        resolutionLedgerId = result.entry.ledger_id;
        escrowStatus = 'RECOGNIZED';
      }
    }
    await updateLoan(loanId, {
      workflow_status: 'CLOSED', insurance_escrow_status: escrowStatus,
      insurance_resolution_ledger_id: resolutionLedgerId,
      insurance_claim_made: payload.insurance_claim_made ? 1 : 0,
      insurance_closure_reason: payload.reason || null,
      loan_closed_at: dayjs().format('YYYY-MM-DD HH:mm:ss'), loan_closed_by: actor.userId,
      closure_idempotency_key: payload.idempotency_key
    }, connection);
    await insertAuditLog({
      userId: actor.userId, action: 'CLOSE_LOAN_INSURANCE_RESOLUTION', entity: 'loan_applications', entityId: loanId,
      metadata: { insurance_claim_made: payload.insurance_claim_made, reason: payload.reason || null, previous_escrow_status: loan.insurance_escrow_status, insurance_escrow_status: escrowStatus, resolution_ledger_id: resolutionLedgerId }, connection
    });
    return findLoanById(loanId, connection);
  });
}

export function buildSchedule({ loan, startDate }) {
  return buildScheduleHelper(loan, startDate);
}

export async function getPersistedSchedule(loanId) {
  return listLoanSchedule(loanId);
}

export async function updateLoanStatus(loanId, status, actor) {
  if (!['ADMIN', 'MANAGER', 'BOARD_MEMBER', 'CREDIT_OFFICER'].includes(actor.role)) {
    throw httpError(403, 'You cannot update loan status');
  }
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  if (actor.role === 'CREDIT_OFFICER' &&
      (status !== 'REJECTED' || loan.created_by_user_id !== actor.userId || !['PENDING', 'UNDER_REVIEW'].includes(loan.workflow_status))) {
    throw httpError(403, 'Credit Officers may only reject their own pending loan applications');
  }
  
  // For APPROVED status, use the approveLoan function only if not already approved
  if (status === 'APPROVED' && loan.workflow_status !== 'APPROVED') {
    return approveLoan(loanId, {
      approved_amount: loan.applied_amount,
      term_months: loan.term_months,
      interest_rate: loan.interest_rate
    }, actor);
  }
  
  if (status === 'REJECTED') {
    if (actor.role !== 'CREDIT_OFFICER') {
      await recordVote(loanId, actor, 'REJECTED', actor.reason || 'Rejected', null);
    }
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

export async function getLoanApprovalStatus(loanId) {
  const loan = await getLoanOrFail(loanId);
  return {
    ...(await getApprovalStatus(loanId)),
    workflow_status: loan.workflow_status,
    current_evaluation: await findEligibilityEvaluation(loan.latest_eligibility_evaluation_id),
    evaluation_history: await listLoanEligibilityEvaluations(loanId)
  };
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
