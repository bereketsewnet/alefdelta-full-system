import httpError from '../../core/utils/httpError.js';
import * as notificationRepo from './notification.repository.js';

/**
 * Create a notification for a member
 * This is a helper function that can be called from anywhere in the system
 */
export async function createNotification(memberId, type, title, message, metadata = null) {
  if (!memberId) {
    console.warn('Attempted to create notification without member_id');
    return null;
  }
  
  try {
    const notificationId = await notificationRepo.createNotification({
      member_id: memberId,
      type,
      title,
      message,
      metadata
    });
    return notificationId;
  } catch (error) {
    // Don't throw - notifications should not break the main flow
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Get notifications for a member
 */
export async function getMemberNotifications(memberId, filters = {}) {
  if (!memberId) {
    throw httpError(400, 'member_id is required');
  }
  
  return await notificationRepo.getMemberNotifications(memberId, filters);
}

/**
 * Get unread count for a member
 */
export async function getUnreadCount(memberId) {
  if (!memberId) {
    throw httpError(400, 'member_id is required');
  }
  
  return await notificationRepo.getUnreadCount(memberId);
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, memberId) {
  if (!notificationId || !memberId) {
    throw httpError(400, 'notification_id and member_id are required');
  }
  
  await notificationRepo.markAsRead(notificationId, memberId);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(memberId) {
  if (!memberId) {
    throw httpError(400, 'member_id is required');
  }
  
  await notificationRepo.markAllAsRead(memberId);
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId, memberId) {
  if (!notificationId || !memberId) {
    throw httpError(400, 'notification_id and member_id are required');
  }
  
  await notificationRepo.deleteNotification(notificationId, memberId);
}

/**
 * Helper functions to create specific notification types
 */
export const NotificationHelpers = {
  async deposit(memberId, amount, accountId, reference) {
    return await createNotification(
      memberId,
      'DEPOSIT',
      'Deposit Received',
      `Your account has been credited with ETB ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })}.${reference ? ` Reference: ${reference}` : ''}`,
      { amount, account_id: accountId, reference, txn_type: 'DEPOSIT' }
    );
  },
  
  async withdrawal(memberId, amount, accountId, reference) {
    return await createNotification(
      memberId,
      'WITHDRAWAL',
      'Withdrawal Processed',
      `ETB ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been withdrawn from your account.${reference ? ` Reference: ${reference}` : ''}`,
      { amount, account_id: accountId, reference, txn_type: 'WITHDRAWAL' }
    );
  },
  
  async loanApproved(memberId, loanId, approvedAmount, productCode) {
    return await createNotification(
      memberId,
      'LOAN_APPROVED',
      'Loan Application Approved',
      `Your loan application for ETB ${Number(approvedAmount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been approved.${productCode ? ` Product: ${productCode}` : ''}`,
      { loan_id: loanId, approved_amount: approvedAmount, product_code: productCode }
    );
  },
  
  async loanRejected(memberId, loanId, reason) {
    return await createNotification(
      memberId,
      'LOAN_REJECTED',
      'Loan Application Rejected',
      `Your loan application has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      { loan_id: loanId, reason }
    );
  },
  
  async loanDisbursed(memberId, loanId, disbursedAmount) {
    return await createNotification(
      memberId,
      'LOAN_DISBURSED',
      'Loan Disbursed',
      `Your loan of ETB ${Number(disbursedAmount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been disbursed to your account.`,
      { loan_id: loanId, disbursed_amount: disbursedAmount }
    );
  },
  
  async loanRepayment(memberId, loanId, amount, paymentMethod) {
    return await createNotification(
      memberId,
      'LOAN_REPAYMENT',
      'Loan Repayment Request Submitted',
      `Your loan repayment request of ETB ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been submitted and is pending approval.`,
      { loan_id: loanId, amount, payment_method: paymentMethod }
    );
  },
  
  async loanRepaymentApproved(memberId, loanId, amount) {
    return await createNotification(
      memberId,
      'LOAN_REPAYMENT_APPROVED',
      'Loan Repayment Approved',
      `Your loan repayment of ETB ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been approved and processed.`,
      { loan_id: loanId, amount }
    );
  },
  
  async loanRepaymentRejected(memberId, loanId, reason) {
    return await createNotification(
      memberId,
      'LOAN_REPAYMENT_REJECTED',
      'Loan Repayment Rejected',
      `Your loan repayment request has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      { loan_id: loanId, reason }
    );
  },
  
  async loanRequestCreated(requestId, memberId, phone, amount) {
    // Create notification for staff (not for member, as this is just a request)
    // We'll notify staff via a system notification or dashboard
    // For now, we'll skip member notification as this is just an initial request
    return null;
  },
  
  async loanRequestApproved(memberId, requestId, amount) {
    if (!memberId) return null; // Can't notify if no member
    return await createNotification(
      memberId,
      'LOAN_REQUEST_APPROVED',
      'Loan Request Approved',
      `Your loan request of ETB ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been approved. Please visit our office to complete your loan application.`,
      { request_id: requestId, amount }
    );
  },
  
  async loanRequestRejected(memberId, requestId, reason) {
    if (!memberId) return null; // Can't notify if no member
    return await createNotification(
      memberId,
      'LOAN_REQUEST_REJECTED',
      'Loan Request Rejected',
      `Your loan request has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      { request_id: requestId, reason }
    );
  },
  
  async depositRequestApproved(memberId, amount, accountId) {
    return await createNotification(
      memberId,
      'DEPOSIT_REQUEST_APPROVED',
      'Deposit Request Approved',
      `Your deposit request of ETB ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been approved and credited to your account.`,
      { amount, account_id: accountId }
    );
  },
  
  async depositRequestRejected(memberId, amount, reason) {
    return await createNotification(
      memberId,
      'DEPOSIT_REQUEST_REJECTED',
      'Deposit Request Rejected',
      `Your deposit request of ETB ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      { amount, reason }
    );
  },
  
  async penaltyApplied(memberId, loanId, penaltyAmount, reason) {
    return await createNotification(
      memberId,
      'PENALTY_APPLIED',
      'Penalty Applied',
      `A penalty of ETB ${Number(penaltyAmount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been applied to your loan.${reason ? ` Reason: ${reason}` : ''}`,
      { loan_id: loanId, penalty_amount: penaltyAmount, reason }
    );
  },
  
  async interestCredited(memberId, accountId, interestAmount) {
    return await createNotification(
      memberId,
      'INTEREST_CREDITED',
      'Interest Credited',
      `Interest of ETB ${Number(interestAmount).toLocaleString('en-ET', { minimumFractionDigits: 2 })} has been credited to your account.`,
      { account_id: accountId, interest_amount: interestAmount }
    );
  },
  
  async accountFrozen(memberId, accountId, reason) {
    return await createNotification(
      memberId,
      'ACCOUNT_FROZEN',
      'Account Frozen',
      `Your account has been frozen.${reason ? ` Reason: ${reason}` : ''}`,
      { account_id: accountId, reason }
    );
  },
  
  async accountUnfrozen(memberId, accountId) {
    return await createNotification(
      memberId,
      'ACCOUNT_UNFROZEN',
      'Account Unfrozen',
      'Your account has been unfrozen and is now active.',
      { account_id: accountId }
    );
  }
};
