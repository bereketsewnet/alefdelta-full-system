import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { withTransaction } from '../../core/db.js';
import { updateAccountBalance } from '../accounts/account.service.js';
import { insertTransaction, listTransactions, listTransactionsByMember, findTransactionById, updateTransactionReceipt } from './transaction.repository.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { findMemberById } from '../members/member.repository.js';
import { updateMonthlyBalanceTracking } from '../accounts/interest-processor.js';
import { updateMemberActivity } from '../members/member-lifecycle-processor.js';

async function getAccountForUpdate(accountId, connection) {
  const [rows] = await connection.query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);
  const account = rows[0];
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  return account;
}

export async function getTransactions(filters) {
  return listTransactions(filters);
}

export async function getMemberTransactions(memberId, filters = {}) {
  return listTransactionsByMember(memberId, filters);
}

export async function updateTransactionReceiptPhoto(txnId, receiptPhotoUrl) {
  const transaction = await findTransactionById(txnId);
  if (!transaction) {
    throw httpError(404, 'Transaction not found');
  }
  
  await updateTransactionReceipt(txnId, receiptPhotoUrl);
  return { ...transaction, receipt_photo_url: receiptPhotoUrl };
}

export async function deposit({ accountId, amount, reference, receiptPhotoUrl, performedBy, idempotencyKey }) {
  if (!accountId) {
    throw httpError(400, 'account_id is required');
  }
  
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }
  
  return withTransaction(async (connection) => {
    const account = await getAccountForUpdate(accountId, connection);
    
    // Deposits are allowed on frozen accounts, but not on closed accounts
    if (account.status === 'CLOSED') {
      throw httpError(403, 'Cannot perform transactions on a closed account');
    }
    
    // Check member status
    const member = await findMemberById(account.member_id);
    if (member) {
      // TERMINATED members cannot perform any transactions
      if (member.status === 'TERMINATED') {
        throw httpError(403, 'Member account is TERMINATED. Please contact manager for reactivation.');
      }
      // ACTIVE, PENDING, INACTIVE members can deposit
      // We'll update their activity date
    }
    
    const newBalance = Number(account.balance) + numericAmount;
    await updateAccountBalance(
      accountId,
      account.version,
      { balance: newBalance },
      connection
    );
    const txn = {
      txn_id: uuid(),
      account_id: accountId,
      txn_type: 'DEPOSIT',
      amount: numericAmount,
      balance_after: newBalance,
      reference,
      receipt_photo_url: receiptPhotoUrl,
      performed_by: performedBy,
      idempotency_key: idempotencyKey
    };
    await insertTransaction(txn, connection);
    
    // Audit log (non-blocking for faster response)
    insertAuditLog({
      userId: performedBy !== 'SYSTEM' ? performedBy : null,
      action: 'DEPOSIT',
      entity: 'accounts',
      entityId: accountId,
      metadata: { amount: numericAmount, reference }
    }).catch(err => {
      console.error('Failed to insert audit log for deposit:', err);
    });
    
    // Update monthly balance tracking for interest calculation (fire-and-forget for faster response)
    updateMonthlyBalanceTracking(accountId, newBalance, 'DEPOSIT').catch(err => {
      console.error('Failed to update monthly balance tracking:', err);
    });
    
    // Update member activity tracking (fire-and-forget for faster response)
    if (account.member_id) {
      updateMemberActivity(account.member_id).catch(err => {
        console.error('Failed to update member activity:', err);
      });
    }
    
    // Create notification (fire-and-forget for faster response)
    if (account.member_id) {
      const { NotificationHelpers } = await import('../notifications/notification.service.js');
      NotificationHelpers.deposit(account.member_id, numericAmount, accountId, reference).catch(err => {
        console.error('Failed to create deposit notification:', err);
      });
    }
    
    return txn;
  });
}

export async function withdraw({ accountId, amount, reference, receiptPhotoUrl, performedBy, idempotencyKey }) {
  if (!accountId) {
    throw httpError(400, 'account_id is required');
  }
  
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }
  
  return withTransaction(async (connection) => {
    const account = await getAccountForUpdate(accountId, connection);
    
    // Withdrawals are NOT allowed on frozen accounts
    if (account.status === 'FROZEN') {
      throw httpError(403, 'Cannot withdraw from a frozen account. Deposits are allowed.');
    }
    if (account.status === 'CLOSED') {
      throw httpError(403, 'Cannot perform transactions on a closed account');
    }
    
    // Check member status
    const member = await findMemberById(account.member_id);
    if (member) {
      // TERMINATED members cannot perform any transactions
      if (member.status === 'TERMINATED') {
        throw httpError(403, 'Member account is TERMINATED. Please contact manager for reactivation.');
      }
      // INACTIVE members can deposit and repay loans, but CANNOT withdraw
      if (member.status === 'INACTIVE') {
        throw httpError(403, 'Cannot withdraw. Member account is INACTIVE due to inactivity. Please contact manager for reactivation. Deposits are allowed.');
      }
      // PENDING members also cannot withdraw
      if (member.status !== 'ACTIVE') {
        throw httpError(403, 'Cannot withdraw. Member account is not ACTIVE. Deposits are allowed.');
      }
    }
    
    const available = Number(account.balance) - Number(account.lien_amount || 0);
    if (available < numericAmount) {
      throw httpError(400, 'Insufficient available balance', { available });
    }
    const newBalance = Number(account.balance) - numericAmount;
    await updateAccountBalance(
      accountId,
      account.version,
      { balance: newBalance },
      connection
    );
    const txn = {
      txn_id: uuid(),
      account_id: accountId,
      txn_type: 'WITHDRAWAL',
      amount: numericAmount,
      balance_after: newBalance,
      reference,
      receipt_photo_url: receiptPhotoUrl,
      performed_by: performedBy,
      idempotency_key: idempotencyKey
    };
    await insertTransaction(txn, connection);
    
    // Audit log (non-blocking for faster response)
    insertAuditLog({
      userId: performedBy !== 'SYSTEM' ? performedBy : null,
      action: 'WITHDRAWAL',
      entity: 'accounts',
      entityId: accountId,
      metadata: { amount: numericAmount, reference }
    }).catch(err => {
      console.error('Failed to insert audit log for withdrawal:', err);
    });
    
    // Update monthly balance tracking for interest calculation (fire-and-forget for faster response)
    updateMonthlyBalanceTracking(accountId, newBalance, 'WITHDRAWAL').catch(err => {
      console.error('Failed to update monthly balance tracking:', err);
    });
    
    // Update member activity tracking (fire-and-forget for faster response)
    if (account.member_id) {
      updateMemberActivity(account.member_id).catch(err => {
        console.error('Failed to update member activity:', err);
      });
    }
    
    // Create notification (fire-and-forget for faster response)
    if (account.member_id) {
      const { NotificationHelpers } = await import('../notifications/notification.service.js');
      NotificationHelpers.withdrawal(account.member_id, numericAmount, accountId, reference).catch(err => {
        console.error('Failed to create withdrawal notification:', err);
      });
    }
    
    return txn;
  });
}

