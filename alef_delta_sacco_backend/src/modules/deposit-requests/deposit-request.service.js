import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { query, withTransaction } from '../../core/db.js';
import { findMemberById } from '../members/member.repository.js';
import { findAccountById } from '../accounts/account.repository.js';
import { deposit } from '../transactions/transaction.service.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import {
  claimFinancialReference,
  cleanFinancialReference,
  markFinancialReferenceRetired
} from '../financial-references/financial-reference.service.js';

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
  const categoryRows = await query(`SELECT ap.financial_category FROM accounts a
    JOIN account_products ap ON ap.product_code = a.product_code WHERE a.account_id = ?`, [payload.account_id]);
  if (categoryRows[0]?.financial_category === 'SHARE_CAPITAL') {
    throw httpError(400, 'Use Request Share Purchase for a Share Capital account');
  }

  // Validate amount
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }

  const referenceNumber = cleanFinancialReference(payload.reference_number);
  if (!referenceNumber) throw httpError(400, 'Reference / Receipt No. is required');
  if (referenceNumber.length > 100) throw httpError(400, 'Reference / Receipt No. must not exceed 100 characters');

  const requestId = uuid();
  await withTransaction(async (connection) => {
    await claimFinancialReference({
      reference: referenceNumber,
      referenceKind: 'DEPOSIT_REQUEST',
      sourceId: requestId,
      memberId,
      status: 'RESERVED',
      connection
    });
    await connection.execute(
      `INSERT INTO deposit_requests
      (request_id, member_id, account_id, amount, reference_number, receipt_photo_url, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [requestId, memberId, payload.account_id, amount, referenceNumber, payload.receipt_photo_url || null, payload.description || null]
    );
    await insertAuditLog({
      userId: null,
      action: 'DEPOSIT_REQUEST_CREATED',
      entity: 'deposit_requests',
      entityId: requestId,
      metadata: { member_id: memberId, amount, account_id: payload.account_id, reference_number: referenceNumber },
      connection
    });
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
    WHERE dr.member_id = ? AND dr.request_type = 'SAVINGS_DEPOSIT'
    ORDER BY dr.created_at DESC`,
    [memberId]
  );
}

export async function listAllDepositRequests(filters = {}) {
  const where = ["dr.request_type = 'SAVINGS_DEPOSIT'"];
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
  const existing = await query('SELECT request_type FROM deposit_requests WHERE request_id = ?', [requestId]);
  if (existing[0]?.request_type === 'SHARE_PURCHASE') {
    const { approveSharePurchaseRequest } = await import('../shares/share.service.js');
    return approveSharePurchaseRequest(requestId, approverId);
  }
  await withTransaction(async (connection) => {
    const [rows] = await connection.query('SELECT * FROM deposit_requests WHERE request_id = ? FOR UPDATE', [requestId]);
    const request = rows[0];
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
      reference: `MP-DEP-${request.request_id}`,
      receiptPhotoUrl: null,
      bankReceiptNo: request.reference_number,
      bankReceiptPhotoUrl: request.receipt_photo_url,
      remark: request.description,
      performedBy: approverId,
      idempotencyKey: `deposit-request-${requestId}`,
      connection,
      bankReferenceOwner: {
        referenceKind: 'DEPOSIT_REQUEST',
        sourceId: requestId
      }
    });

    // Update request status
    await connection.query(
      `UPDATE deposit_requests 
      SET status = 'APPROVED', approved_by = ?, approved_at = NOW()
      WHERE request_id = ?`,
      [approverId, requestId]
    );

    await insertAuditLog({
      userId: approverId,
      action: 'DEPOSIT_REQUEST_APPROVED',
      entity: 'deposit_requests',
      entityId: requestId,
      metadata: { transaction_id: transaction.txn_id },
      connection
    });
  });

  const approvedRequest = await findDepositRequestById(requestId);
  if (approvedRequest?.member_id) {
    const { NotificationHelpers } = await import('../notifications/notification.service.js');
    NotificationHelpers.depositRequestApproved(approvedRequest.member_id, approvedRequest.amount, approvedRequest.account_id).catch(err => {
      console.error('Failed to create deposit request approval notification:', err);
    });
  }
  return approvedRequest;
}

export async function rejectDepositRequest(requestId, approverId, reason) {
  const existing = await query('SELECT request_type FROM deposit_requests WHERE request_id = ?', [requestId]);
  if (existing[0]?.request_type === 'SHARE_PURCHASE') {
    const { rejectSharePurchaseRequest } = await import('../shares/share.service.js');
    return rejectSharePurchaseRequest(requestId, approverId, reason);
  }
  const request = await findDepositRequestById(requestId);
  if (!request) {
    throw httpError(404, 'Deposit request not found');
  }
  if (request.status !== 'PENDING') {
    throw httpError(400, `Request is already ${request.status}`);
  }

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE deposit_requests
      SET status = 'REJECTED', approved_by = ?, approved_at = NOW(), rejection_reason = ?
      WHERE request_id = ? AND status = 'PENDING'`,
      [approverId, reason || null, requestId]
    );
    await markFinancialReferenceRetired(request.reference_number, 'DEPOSIT_REQUEST', requestId, connection);
    await insertAuditLog({
      userId: approverId,
      action: 'DEPOSIT_REQUEST_REJECTED',
      entity: 'deposit_requests',
      entityId: requestId,
      metadata: { reason },
      connection
    });
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
