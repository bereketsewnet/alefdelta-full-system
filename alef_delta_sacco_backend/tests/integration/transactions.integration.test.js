import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const accountState = {
  account_id: 'acc-1',
  balance: 1000,
  lien_amount: 0,
  version: 1
};

const insertTransactionMock = jest.fn();
const auditLogMock = jest.fn();

let queue = Promise.resolve();
const connection = {
  async query() {
    return [[{ ...accountState }]];
  }
};

jest.unstable_mockModule('../../src/core/db.js', () => ({
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
  listTransactions: jest.fn()
}));

jest.unstable_mockModule('../../src/modules/admin/audit.repository.js', () => ({
  insertAuditLog: auditLogMock
}));

const transactionService = await import('../../src/modules/transactions/transaction.service.js');

beforeEach(() => {
  accountState.balance = 1000;
  accountState.version = 1;
  insertTransactionMock.mockClear();
  auditLogMock.mockClear();
  queue = Promise.resolve();
});

describe('deposit & withdraw integration', () => {
  it('processes concurrent withdrawals safely', async () => {
    const attempt1 = transactionService.withdraw({
      accountId: 'acc-1',
      amount: 600,
      performedBy: 'user-1',
      idempotencyKey: 'key-1'
    });
    const attempt2 = transactionService.withdraw({
      accountId: 'acc-1',
      amount: 600,
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
});
