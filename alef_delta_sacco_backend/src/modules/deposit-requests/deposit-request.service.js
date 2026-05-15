import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { query, withTransaction } from '../../core/db.js';
import { findMemberById } from '../members/member.repository.js';
import { findAccountById } from '../accounts/account.repository.js';
import { deposit } from '../transactions/transaction.service.js';
import { insertAuditLog } from '../admin/audit.repository.js';

export async function createDepositRequest(memberId, payload) {
  // Verify member exists
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }

  // Verify account belongs to member
  const account = await findAccountById(payload.account_id);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  if (account.member_id !== memberId) {
    throw httpError(403, 'Account does not belong to this member');
  }

  // Validate amount
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }

  // Create deposit request
  const requestId = uuid();
  await query(
    `INSERT INTO deposit_requests 
    (request_id, member_id, account_id, amount, reference_number, receipt_photo_url, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      requestId,
      memberId,
      payload.account_id,
      amount,
      payload.reference_number || null,
      payload.receipt_photo_url || null,
      payload.description || null,
    ]
  );

  await insertAuditLog({
    userId: null,
    action: 'DEPOSIT_REQUEST_CREATED',
    entity: 'deposit_requests',
    entityId: requestId,
    metadata: { member_id: memberId, amount, account_id: payload.account_id },
  });

  return findDepositRequestById(requestId);
}

export async function findDepositRequestById(requestId) {
  const rows = await query(
    `SELECT 
      dr.*,
      m.first_name as member_first_name,
      m.last_name as member_last_name,
      m.membership_no,
      a.product_code as account_product_code,
      u.username as approver_username,
      u.role as approver_role
    FROM deposit_requests dr
    JOIN members m ON dr.member_id = m.member_id
    JOIN accounts a ON dr.account_id = a.account_id
    LEFT JOIN users u ON dr.approved_by = u.user_id
    WHERE dr.request_id = ?`,
    [requestId]
  );
  return rows[0] || null;
}

export async function listDepositRequestsByMember(memberId) {
  return query(
    `SELECT 
      dr.*,
      a.product_code as account_product_code,
      u.username as approver_username,
      u.role as approver_role
    FROM deposit_requests dr
    JOIN accounts a ON dr.account_id = a.account_id
    LEFT JOIN users u ON dr.approved_by = u.user_id
    WHERE dr.member_id = ?
    ORDER BY dr.created_at DESC`,
    [memberId]
  );
}

export async function listAllDepositRequests(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.status && filters.status !== 'ALL') {
    where.push('dr.status = ?');
    params.push(filters.status);
  }
  
  if (filters.member_id) {
    where.push('dr.member_id = ?');
    params.push(filters.member_id);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  return query(
    `SELECT 
      dr.*,
      m.first_name as member_first_name,
      m.last_name as member_last_name,
      m.membership_no,
      a.product_code as account_product_code,
      u.username as approver_username,
      u.role as approver_role
    FROM deposit_requests dr
    JOIN members m ON dr.member_id = m.member_id
    JOIN accounts a ON dr.account_id = a.account_id
    LEFT JOIN users u ON dr.approved_by = u.user_id
    ${whereClause}
    ORDER BY dr.created_at DESC`,
    params
  );
}

export async function approveDepositRequest(requestId, approverId) {
  return withTransaction(async (connection) => {
    const request = await findDepositRequestById(requestId);
    if (!request) {
      throw httpError(404, 'Deposit request not found');
    }
    if (request.status !== 'PENDING') {
      throw httpError(400, `Request is already ${request.status}`);
    }

    // Create the actual deposit transaction
    const transaction = await deposit({
      accountId: request.account_id,
      amount: request.amount,
      reference: request.reference_number || `Deposit Request ${request.request_id.substring(0, 8)}`,
      receiptPhotoUrl: request.receipt_photo_url,
      performedBy: approverId,
      idempotencyKey: `deposit-request-${requestId}`,
    });

    // Update request status
    await connection.query(
      `UPDATE deposit_requests 
      SET status = 'APPROVED', approved_by = ?, approved_at = NOW()
      WHERE request_id = ?`,
      [approverId, requestId]
    );

    // Audit log (non-blocking for faster response)
    insertAuditLog({
      userId: approverId,
      action: 'DEPOSIT_REQUEST_APPROVED',
      entity: 'deposit_requests',
      entityId: requestId,
      metadata: { transaction_id: transaction.txn_id },
    }).catch(err => {
      console.error('Failed to insert audit log for deposit request approval:', err);
    });

    const approvedRequest = await findDepositRequestById(requestId);
    
    // Create notification (fire-and-forget for faster response)
    if (approvedRequest.member_id) {
      const { NotificationHelpers } = await import('../notifications/notification.service.js');
      NotificationHelpers.depositRequestApproved(
        approvedRequest.member_id,
        request.amount,
        request.account_id
      ).catch(err => {
        console.error('Failed to create deposit request approval notification:', err);
      });
    }

    return approvedRequest;
  });
}

export async function rejectDepositRequest(requestId, approverId, reason) {
  const request = await findDepositRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Deposit request not found');
  }
  if (request.status !== 'PENDING') {
    throw httpError(400, `Request is already ${request.status}`);
  }

  await query(
    `UPDATE deposit_requests 
    SET status = 'REJECTED', approved_by = ?, approved_at = NOW(), rejection_reason = ?
    WHERE request_id = ?`,
    [approverId, reason || null, requestId]
  );

  await insertAuditLog({
    userId: approverId,
    action: 'DEPOSIT_REQUEST_REJECTED',
    entity: 'deposit_requests',
    entityId: requestId,
    metadata: { reason },
  });

  const rejectedRequest = await findDepositRequestById(requestId);
  
  // Create notification (fire-and-forget for faster response)
  if (rejectedRequest.member_id) {
    const { NotificationHelpers } = await import('../notifications/notification.service.js');
    NotificationHelpers.depositRequestRejected(
      rejectedRequest.member_id,
      request.amount,
      reason
    ).catch(err => {
      console.error('Failed to create deposit request rejection notification:', err);
    });
  }

  return rejectedRequest;
}

