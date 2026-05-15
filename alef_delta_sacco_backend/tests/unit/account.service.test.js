import { describe, it, expect } from '@jest/globals';
import { updateAccountBalance } from '../../src/modules/accounts/account.service.js';

function createConnection({ affectedRows, latestAccount }) {
  return {
    execute: async () => [{ affectedRows }],
    query: async () => [[latestAccount]]
  };
}

describe('updateAccountBalance optimistic locking', () => {
  it('throws 409 when version mismatch occurs', async () => {
    const connection = createConnection({
      affectedRows: 0,
      latestAccount: { account_id: 'acc-1', version: 5 }
    });
    await expect(
      updateAccountBalance('acc-1', 4, { balance: 100 }, connection)
    ).rejects.toHaveProperty('status', 409);
  });

  it('succeeds when affected rows > 0', async () => {
    const connection = createConnection({ affectedRows: 1 });
    await expect(
      updateAccountBalance('acc-1', 1, { balance: 150 }, connection)
    ).resolves.toBe(true);
  });
});
