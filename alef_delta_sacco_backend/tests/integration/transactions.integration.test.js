import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const accountState = {
  account_id: 'acc-1',
  balance: 1000,
  lien_amount: 0,
  version: 1,
  financial_category: 'VOLUNTARY_SAVINGS'
};

const insertTransactionMock = jest.fn();
const auditLogMock = jest.fn(async () => undefined);
const findTransactionByIdMock = jest.fn();
const updateTransactionBankReceiptMock = jest.fn();

let queue = Promise.resolve();
const connection = {
  async query(sql) {
    if (sql.includes('financial_reference_registry')) return [[]];
    return [[{ ...accountState }]];
  },
  async execute() {
    return [{ affectedRows: 1 }];
  }
};

jest.unstable_mockModule('../../src/core/db.js', () => ({
  query: jest.fn(),
  execute: jest.fn(),
  withTransaction: (handler) => {
    queue = queue.then(() => handler(connection));
    return queue;
  }
}));

jest.unstable_mockModule('../../src/modules/accounts/account.service.js', () => ({
  updateAccountBalance: jest.fn(async (_id, expectedVersion, updates) => {
    if (expectedVersion !== accountState.version) {
      const err = new Error('conflict');
      err.status = 409;
      throw err;
    }
    accountState.balance = updates.balance;
    if (typeof updates.lien_amount === 'number') {
      accountState.lien_amount = updates.lien_amount;
    }
    accountState.version += 1;
    return true;
  })
}));

jest.unstable_mockModule('../../src/modules/transactions/transaction.repository.js', () => ({
  insertTransaction: insertTransactionMock,
  listTransactions: jest.fn(),
  listTransactionsByMember: jest.fn(),
  findTransactionById: findTransactionByIdMock,
  updateTransactionReceipt: jest.fn(),
  updateTransactionBankReceipt: updateTransactionBankReceiptMock
}));

jest.unstable_mockModule('../../src/modules/members/member.repository.js', () => ({ findMemberById: jest.fn(async () => null) }));
jest.unstable_mockModule('../../src/modules/accounts/interest-processor.js', () => ({ updateMonthlyBalanceTracking: jest.fn(async () => undefined) }));
jest.unstable_mockModule('../../src/modules/members/member-lifecycle-processor.js', () => ({ updateMemberActivity: jest.fn(async () => undefined) }));

jest.unstable_mockModule('../../src/modules/admin/audit.repository.js', () => ({
  insertAuditLog: auditLogMock
}));

const transactionService = await import('../../src/modules/transactions/transaction.service.js');

beforeEach(() => {
  accountState.balance = 1000;
  accountState.version = 1;
  accountState.financial_category = 'VOLUNTARY_SAVINGS';
  insertTransactionMock.mockClear();
  auditLogMock.mockClear();
  findTransactionByIdMock.mockReset();
  updateTransactionBankReceiptMock.mockReset();
  queue = Promise.resolve();
});

describe('deposit & withdraw integration', () => {
  it('updates only the bank receipt photo for an existing account transaction', async () => {
    findTransactionByIdMock.mockResolvedValue({
      txn_id: 'txn-1',
      amount: 800,
      balance_after: 800,
      bank_receipt_photo_url: '/uploads/old-bank.jpg'
    });

    const result = await transactionService.updateTransactionBankReceiptPhoto(
      'txn-1',
      '/uploads/new-bank.jpg'
    );

    expect(updateTransactionBankReceiptMock).toHaveBeenCalledWith('txn-1', '/uploads/new-bank.jpg');
    expect(result).toMatchObject({
      txn_id: 'txn-1',
      amount: 800,
      balance_after: 800,
      bank_receipt_photo_url: '/uploads/new-bank.jpg'
    });
  });

  it('stores company proof, bank proof and remark on a deposit', async () => {
    const result = await transactionService.deposit({
      accountId: 'acc-1',
      amount: 100,
      reference: 'SACCO-001',
      receiptPhotoUrl: '/uploads/company.jpg',
      bankReceiptNo: 'BANK-001',
      bankReceiptPhotoUrl: '/uploads/bank.jpg',
      remark: 'Opening cash deposit',
      performedBy: 'user-1',
      idempotencyKey: 'proof-key-1'
    });

    expect(result).toMatchObject({
      reference: 'SACCO-001',
      receipt_photo_url: '/uploads/company.jpg',
      bank_receipt_no: 'BANK-001',
      bank_receipt_photo_url: '/uploads/bank.jpg',
      remark: 'Opening cash deposit'
    });
    expect(insertTransactionMock).toHaveBeenCalledWith(expect.objectContaining({
      bank_receipt_no: 'BANK-001',
      bank_receipt_photo_url: '/uploads/bank.jpg',
      remark: 'Opening cash deposit'
    }), connection);
  });

  it('processes concurrent withdrawals safely', async () => {
    const attempt1 = transactionService.withdraw({
      accountId: 'acc-1',
      amount: 600,
      reference: 'WITHDRAWAL-001',
      performedBy: 'user-1',
      idempotencyKey: 'key-1'
    });
    const attempt2 = transactionService.withdraw({
      accountId: 'acc-1',
      amount: 600,
      reference: 'WITHDRAWAL-002',
      performedBy: 'user-2',
      idempotencyKey: 'key-2'
    });
    const [first, second] = await Promise.allSettled([attempt1, attempt2]);
    expect([first.status, second.status]).toContain('rejected');
    const success = first.status === 'fulfilled' ? first.value : second.value;
    expect(success.balance_after).toBe(400);
    const failure = first.status === 'rejected' ? first.reason : second.reason;
    expect(failure.message).toMatch(/Insufficient available balance/);
    expect(insertTransactionMock).toHaveBeenCalledTimes(1);
  });

  it('prevents generic deposits from bypassing Share Capital unit accounting', async () => {
    accountState.financial_category = 'SHARE_CAPITAL';
    await expect(transactionService.deposit({
      accountId: 'acc-1',
      amount: 100,
      reference: 'SHARE-BYPASS-001',
      performedBy: 'user-1',
      idempotencyKey: 'share-bypass-key'
    })).rejects.toThrow(/Use Share Purchase/);
    expect(insertTransactionMock).not.toHaveBeenCalled();
  });
});
