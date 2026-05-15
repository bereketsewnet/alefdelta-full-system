import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { query, withTransaction } from '../../core/db.js';
import { findMemberById } from '../members/member.repository.js';
import { findLoanById } from '../loans/loan.repository.js';
import { processLoanRepayment } from '../loan-repayments/repayment.service.js';
import { insertAuditLog } from '../admin/audit.repository.js';

export async function createLoanRepaymentRequest(memberId, payload) {
  // Verify member exists
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }

  // Verify loan belongs to member and is approved
  const loan = await findLoanById(payload.loan_id);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  if (loan.member_id !== memberId) {
    throw httpError(403, 'Loan does not belong to this member');
  }
  if (loan.workflow_status !== 'APPROVED') {
    throw httpError(400, 'Loan must be approved before accepting repayment requests');
  }
  if (loan.is_fully_paid) {
    throw httpError(400, 'Loan is already fully paid');
  }

  // Validate amount
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }

  // Create loan repayment request
  const requestId = uuid();
  await query(
    `INSERT INTO loan_repayment_requests 
    (request_id, member_id, loan_id, amount, payment_method, receipt_number, receipt_photo_url, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      requestId,
      memberId,
      payload.loan_id,
      amount,
      payload.payment_method || 'CASH',
      payload.receipt_number || null,
      payload.receipt_photo_url || null,
      payload.notes || null,
    ]
  );

  await insertAuditLog({
    userId: null,
    action: 'LOAN_REPAYMENT_REQUEST_CREATED',
    entity: 'loan_repayment_requests',
    entityId: requestId,
    metadata: { member_id: memberId, amount, loan_id: payload.loan_id },
  });

  // Create notification (fire-and-forget for faster response)
  const { NotificationHelpers } = await import('../notifications/notification.service.js');
  NotificationHelpers.loanRepayment(
    memberId,
    payload.loan_id,
    amount,
    payload.payment_method || 'CASH'
  ).catch(err => {
    console.error('Failed to create loan repayment request notification:', err);
  });

  return findLoanRepaymentRequestById(requestId);
}

export async function findLoanRepaymentRequestById(requestId) {
  const rows = await query(
    `SELECT 
      lrr.*,
      m.first_name as member_first_name,
      m.last_name as member_last_name,
      m.membership_no,
      l.product_code as loan_product_code,
      l.approved_amount as loan_amount,
      u.username as approver_username,
      u.role as approver_role
    FROM loan_repayment_requests lrr
    JOIN members m ON lrr.member_id = m.member_id
    JOIN loan_applications l ON lrr.loan_id = l.loan_id
    LEFT JOIN users u ON lrr.approved_by = u.user_id
    WHERE lrr.request_id = ?`,
    [requestId]
  );
  return rows[0] || null;
}

export async function listLoanRepaymentRequestsByMember(memberId) {
  return query(
    `SELECT 
      lrr.*,
      l.product_code as loan_product_code,
      l.approved_amount as loan_amount,
      u.username as approver_username,
      u.role as approver_role
    FROM loan_repayment_requests lrr
    JOIN loan_applications l ON lrr.loan_id = l.loan_id
    LEFT JOIN users u ON lrr.approved_by = u.user_id
    WHERE lrr.member_id = ?
    ORDER BY lrr.created_at DESC`,
    [memberId]
  );
}

export async function listAllLoanRepaymentRequests(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.status && filters.status !== 'ALL') {
    where.push('lrr.status = ?');
    params.push(filters.status);
  }
  
  if (filters.member_id) {
    where.push('lrr.member_id = ?');
    params.push(filters.member_id);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  return query(
    `SELECT 
      lrr.*,
      m.first_name as member_first_name,
      m.last_name as member_last_name,
      m.membership_no,
      l.product_code as loan_product_code,
      l.approved_amount as loan_amount,
      u.username as approver_username,
      u.role as approver_role
    FROM loan_repayment_requests lrr
    JOIN members m ON lrr.member_id = m.member_id
    JOIN loan_applications l ON lrr.loan_id = l.loan_id
    LEFT JOIN users u ON lrr.approved_by = u.user_id
    ${whereClause}
    ORDER BY lrr.created_at DESC`,
    params
  );
}

export async function approveLoanRepaymentRequest(requestId, approverId) {
  return withTransaction(async (connection) => {
    const request = await findLoanRepaymentRequestById(requestId);
    if (!request) {
      throw httpError(404, 'Loan repayment request not found');
    }
    if (request.status !== 'PENDING') {
      throw httpError(400, `Request is already ${request.status}`);
    }

    // Process the actual loan repayment
    const repayment = await processLoanRepayment(
      request.loan_id,
      {
        amount: request.amount,
        payment_method: request.payment_method,
        // Member request stores bank receipt in receipt_number/receipt_photo_url
        bank_receipt_no: request.receipt_number,
        bank_receipt_photo_url: request.receipt_photo_url,
        // Company receipt is added later by staff (optional)
        company_receipt_no: null,
        company_receipt_photo_url: null,
        notes: request.notes,
      },
      null,
      { userId: approverId, role: 'TELLER' }
    );

    // Update request status
    await connection.query(
      `UPDATE loan_repayment_requests 
      SET status = 'APPROVED', approved_by = ?, approved_at = NOW()
      WHERE request_id = ?`,
      [approverId, requestId]
    );

    // Audit log (non-blocking for faster response)
    insertAuditLog({
      userId: approverId,
      action: 'LOAN_REPAYMENT_REQUEST_APPROVED',
      entity: 'loan_repayment_requests',
      entityId: requestId,
      metadata: { repayment_id: repayment.repayment_id },
    }).catch(err => {
      console.error('Failed to insert audit log for loan repayment request approval:', err);
    });

    const approvedRequest = await findLoanRepaymentRequestById(requestId);
    
    // Create notification (fire-and-forget for faster response)
    if (approvedRequest.member_id) {
      const { NotificationHelpers } = await import('../notifications/notification.service.js');
      NotificationHelpers.loanRepaymentApproved(
        approvedRequest.member_id,
        request.loan_id,
        request.amount
      ).catch(err => {
        console.error('Failed to create loan repayment approval notification:', err);
      });
    }

    return approvedRequest;
  });
}

export async function rejectLoanRepaymentRequest(requestId, approverId, reason) {
  const request = await findLoanRepaymentRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Loan repayment request not found');
  }
  if (request.status !== 'PENDING') {
    throw httpError(400, `Request is already ${request.status}`);
  }

  await query(
    `UPDATE loan_repayment_requests 
    SET status = 'REJECTED', approved_by = ?, approved_at = NOW(), rejection_reason = ?
    WHERE request_id = ?`,
    [approverId, reason || null, requestId]
  );

  await insertAuditLog({
    userId: approverId,
    action: 'LOAN_REPAYMENT_REQUEST_REJECTED',
    entity: 'loan_repayment_requests',
    entityId: requestId,
    metadata: { reason },
  });

  const rejectedRequest = await findLoanRepaymentRequestById(requestId);
  
  // Create notification (fire-and-forget for faster response)
  if (rejectedRequest.member_id) {
    const { NotificationHelpers } = await import('../notifications/notification.service.js');
    NotificationHelpers.loanRepaymentRejected(
      rejectedRequest.member_id,
      request.loan_id,
      reason
    ).catch(err => {
      console.error('Failed to create loan repayment rejection notification:', err);
    });
  }

  return rejectedRequest;
}


