import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { withTransaction } from '../../core/db.js';
import { updateAccountBalance } from '../accounts/account.service.js';
import {
  insertTransaction,
  listTransactions,
  listTransactionsByMember,
  findTransactionById,
  updateTransactionReceipt,
  updateTransactionBankReceipt
} from './transaction.repository.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { findMemberById } from '../members/member.repository.js';
import { updateMonthlyBalanceTracking } from '../accounts/interest-processor.js';
import { updateMemberActivity } from '../members/member-lifecycle-processor.js';
import {
  assertFinancialReferenceOwner,
  claimFinancialReference,
  cleanFinancialReference,
  markFinancialReferencePosted
} from '../financial-references/financial-reference.service.js';

async function getAccountForUpdate(accountId, connection) {
  const [rows] = await connection.query(`SELECT a.*, ap.financial_category
    FROM accounts a
    JOIN account_products ap ON ap.product_code = a.product_code
    WHERE a.account_id = ? FOR UPDATE`, [accountId]);
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

export async function updateTransactionBankReceiptPhoto(txnId, bankReceiptPhotoUrl) {
  const transaction = await findTransactionById(txnId);
  if (!transaction) {
    throw httpError(404, 'Transaction not found');
  }

  await updateTransactionBankReceipt(txnId, bankReceiptPhotoUrl);
  return { ...transaction, bank_receipt_photo_url: bankReceiptPhotoUrl };
}

export async function deposit({
  accountId,
  amount,
  reference,
  receiptPhotoUrl,
  bankReceiptNo = null,
  bankReceiptPhotoUrl = null,
  remark = null,
  performedBy,
  idempotencyKey,
  connection: existingConnection = null,
  referenceOwner = null,
  bankReferenceOwner = null
}) {
  if (!accountId) {
    throw httpError(400, 'account_id is required');
  }
  
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }
  
  const performDeposit = async (connection) => {
    const account = await getAccountForUpdate(accountId, connection);
    if (account.financial_category === 'SHARE_CAPITAL') {
      throw httpError(400, 'Use Share Purchase for a Share Capital account so ownership units are recorded correctly');
    }
    
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
    
    const cleanReference = cleanFinancialReference(reference);
    if (!cleanReference) throw httpError(400, 'Reference / Receipt No. is required');
    const cleanBankReceiptNo = cleanFinancialReference(bankReceiptNo);
    const txnId = uuid();
    if (referenceOwner) {
      await assertFinancialReferenceOwner({
        reference: cleanReference,
        referenceKind: referenceOwner.referenceKind,
        sourceId: referenceOwner.sourceId,
        connection
      });
      await markFinancialReferencePosted(cleanReference, referenceOwner.referenceKind, referenceOwner.sourceId, connection);
    } else {
      await claimFinancialReference({
        reference: cleanReference,
        referenceKind: 'ACCOUNT_TRANSACTION',
        sourceId: txnId,
        memberId: account.member_id,
        status: 'POSTED',
        connection
      });
    }
    if (cleanBankReceiptNo) {
      if (bankReferenceOwner) {
        await assertFinancialReferenceOwner({
          reference: cleanBankReceiptNo,
          referenceKind: bankReferenceOwner.referenceKind,
          sourceId: bankReferenceOwner.sourceId,
          connection
        });
        await markFinancialReferencePosted(
          cleanBankReceiptNo,
          bankReferenceOwner.referenceKind,
          bankReferenceOwner.sourceId,
          connection
        );
      } else {
        await claimFinancialReference({
          reference: cleanBankReceiptNo,
          referenceKind: 'ACCOUNT_TRANSACTION_BANK',
          sourceId: txnId,
          memberId: account.member_id,
          status: 'POSTED',
          connection
        });
      }
    }

    const newBalance = Number(account.balance) + numericAmount;
    await updateAccountBalance(
      accountId,
      account.version,
      { balance: newBalance },
      connection
    );
    const txn = {
      txn_id: txnId,
      account_id: accountId,
      txn_type: 'DEPOSIT',
      amount: numericAmount,
      balance_after: newBalance,
      reference: cleanReference,
      receipt_photo_url: receiptPhotoUrl,
      bank_receipt_no: cleanBankReceiptNo || null,
      bank_receipt_photo_url: bankReceiptPhotoUrl,
      remark: remark?.trim?.() || null,
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
      metadata: { amount: numericAmount, reference: cleanReference, bank_receipt_no: cleanBankReceiptNo || null, remark: remark?.trim?.() || null }
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
      NotificationHelpers.deposit(account.member_id, numericAmount, accountId, cleanReference).catch(err => {
        console.error('Failed to create deposit notification:', err);
      });
    }
    
    return txn;
  };

  if (existingConnection) return performDeposit(existingConnection);
  return withTransaction(performDeposit);
}

export async function withdraw({
  accountId,
  amount,
  reference,
  receiptPhotoUrl,
  bankReceiptNo = null,
  bankReceiptPhotoUrl = null,
  remark = null,
  performedBy,
  idempotencyKey,
  connection: existingConnection = null
}) {
  if (!accountId) {
    throw httpError(400, 'account_id is required');
  }
  
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }
  
  const performWithdrawal = async (connection) => {
    const account = await getAccountForUpdate(accountId, connection);
    if (account.financial_category === 'SHARE_CAPITAL') {
      throw httpError(400, 'Use Share Redemption for a Share Capital account so FIFO ownership units are recorded correctly');
    }
    
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
    
    const cleanReference = cleanFinancialReference(reference);
    if (!cleanReference) throw httpError(400, 'Reference / Receipt No. is required');
    const cleanBankReceiptNo = cleanFinancialReference(bankReceiptNo);
    const txnId = uuid();
    await claimFinancialReference({
      reference: cleanReference,
      referenceKind: 'ACCOUNT_TRANSACTION',
      sourceId: txnId,
      memberId: account.member_id,
      status: 'POSTED',
      connection
    });
    if (cleanBankReceiptNo) {
      await claimFinancialReference({
        reference: cleanBankReceiptNo,
        referenceKind: 'ACCOUNT_TRANSACTION_BANK',
        sourceId: txnId,
        memberId: account.member_id,
        status: 'POSTED',
        connection
      });
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
      txn_id: txnId,
      account_id: accountId,
      txn_type: 'WITHDRAWAL',
      amount: numericAmount,
      balance_after: newBalance,
      reference: cleanReference,
      receipt_photo_url: receiptPhotoUrl,
      bank_receipt_no: cleanBankReceiptNo || null,
      bank_receipt_photo_url: bankReceiptPhotoUrl,
      remark: remark?.trim?.() || null,
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
      metadata: { amount: numericAmount, reference: cleanReference, bank_receipt_no: cleanBankReceiptNo || null, remark: remark?.trim?.() || null }
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
      NotificationHelpers.withdrawal(account.member_id, numericAmount, accountId, cleanReference).catch(err => {
        console.error('Failed to create withdrawal notification:', err);
      });
    }
    
    return txn;
  };

  if (existingConnection) return performWithdrawal(existingConnection);
  return withTransaction(performWithdrawal);
}
