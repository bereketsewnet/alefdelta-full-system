import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { query, withTransaction } from '../../core/db.js';
import { findMemberById } from '../members/member.repository.js';
import { insertAuditLog } from '../admin/audit.repository.js';

export async function createLoanRequest(memberId, phone, payload) {
  // Validate amount
  const amount = Number(payload.requested_amount);
  if (!amount || amount <= 0) {
    throw httpError(400, 'Requested amount must be greater than zero');
  }

  // Validate loan purpose
  if (!payload.loan_purpose || payload.loan_purpose.trim() === '') {
    throw httpError(400, 'Loan purpose is required');
  }

  // If OTHER purpose, require other_purpose text
  if (payload.loan_purpose === 'OTHER' && (!payload.other_purpose || payload.other_purpose.trim() === '')) {
    throw httpError(400, 'Please specify the loan purpose');
  }

  // If member_id provided, verify member exists
  if (memberId) {
    const member = await findMemberById(memberId);
    if (!member) {
      throw httpError(404, 'Member not found');
    }
  }

  // Create loan request
  const requestId = uuid();
  await query(
    `INSERT INTO loan_requests 
    (request_id, member_id, phone, loan_purpose, other_purpose, requested_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      requestId,
      memberId || null,
      phone || null,
      payload.loan_purpose,
      payload.loan_purpose === 'OTHER' ? payload.other_purpose : null,
      amount,
    ]
  );

  await insertAuditLog({
    userId: null,
    action: 'LOAN_REQUEST_CREATED',
    entity: 'loan_requests',
    entityId: requestId,
    metadata: { member_id: memberId, phone, amount, purpose: payload.loan_purpose },
  });

  // Create notification for staff (fire-and-forget)
  const { NotificationHelpers } = await import('../notifications/notification.service.js');
  NotificationHelpers.loanRequestCreated(requestId, memberId, phone, amount).catch(err => {
    console.error('Failed to create loan request notification:', err);
  });

  return findLoanRequestById(requestId);
}

export async function findLoanRequestById(requestId) {
  const rows = await query(
    `SELECT 
      lr.*,
      m.first_name as member_first_name,
      m.last_name as member_last_name,
      m.membership_no,
      m.phone_primary as member_phone,
      u.username as approver_username,
      u.role as approver_role
    FROM loan_requests lr
    LEFT JOIN members m ON lr.member_id = m.member_id
    LEFT JOIN users u ON lr.approved_by = u.user_id
    WHERE lr.request_id = ?`,
    [requestId]
  );
  return rows[0] || null;
}

export async function listLoanRequestsByMember(memberId) {
  return query(
    `SELECT 
      lr.*,
      u.username as approver_username,
      u.role as approver_role
    FROM loan_requests lr
    LEFT JOIN users u ON lr.approved_by = u.user_id
    WHERE lr.member_id = ?
    ORDER BY lr.created_at DESC`,
    [memberId]
  );
}

export async function listAllLoanRequests(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.status && filters.status !== 'ALL') {
    where.push('lr.status = ?');
    params.push(filters.status);
  }
  
  if (filters.member_id) {
    where.push('lr.member_id = ?');
    params.push(filters.member_id);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  return query(
    `SELECT 
      lr.*,
      m.first_name as member_first_name,
      m.last_name as member_last_name,
      m.membership_no,
      m.phone_primary as member_phone,
      u.username as approver_username,
      u.role as approver_role
    FROM loan_requests lr
    LEFT JOIN members m ON lr.member_id = m.member_id
    LEFT JOIN users u ON lr.approved_by = u.user_id
    ${whereClause}
    ORDER BY lr.created_at DESC`,
    params
  );
}

export async function approveLoanRequest(requestId, approverId, notes) {
  const request = await findLoanRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Loan request not found');
  }
  if (request.status !== 'PENDING') {
    throw httpError(400, `Request is already ${request.status}`);
  }

  await query(
    `UPDATE loan_requests 
    SET status = 'APPROVED', approved_by = ?, approved_at = NOW(), notes = ?
    WHERE request_id = ?`,
    [approverId, notes || null, requestId]
  );

  await insertAuditLog({
    userId: approverId,
    action: 'LOAN_REQUEST_APPROVED',
    entity: 'loan_requests',
    entityId: requestId,
    metadata: { notes },
  });

  const approvedRequest = await findLoanRequestById(requestId);
  
  // Create notification (fire-and-forget)
  if (approvedRequest.member_id) {
    const { NotificationHelpers } = await import('../notifications/notification.service.js');
    NotificationHelpers.loanRequestApproved(
      approvedRequest.member_id,
      requestId,
      approvedRequest.requested_amount
    ).catch(err => {
      console.error('Failed to create loan request approval notification:', err);
    });
  }

  return approvedRequest;
}

export async function rejectLoanRequest(requestId, approverId, reason, notes) {
  const request = await findLoanRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Loan request not found');
  }
  if (request.status !== 'PENDING') {
    throw httpError(400, `Request is already ${request.status}`);
  }

  await query(
    `UPDATE loan_requests 
    SET status = 'REJECTED', approved_by = ?, approved_at = NOW(), rejection_reason = ?, notes = ?
    WHERE request_id = ?`,
    [approverId, reason || null, notes || null, requestId]
  );

  await insertAuditLog({
    userId: approverId,
    action: 'LOAN_REQUEST_REJECTED',
    entity: 'loan_requests',
    entityId: requestId,
    metadata: { reason, notes },
  });

  const rejectedRequest = await findLoanRequestById(requestId);
  
  // Create notification (fire-and-forget)
  if (rejectedRequest.member_id) {
    const { NotificationHelpers } = await import('../notifications/notification.service.js');
    NotificationHelpers.loanRequestRejected(
      rejectedRequest.member_id,
      requestId,
      reason
    ).catch(err => {
      console.error('Failed to create loan request rejection notification:', err);
    });
  }

  return rejectedRequest;
}

