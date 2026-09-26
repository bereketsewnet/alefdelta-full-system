import { jest } from '@jest/globals';
import { ensureMemberSavingsAccounts, ensureMemberShareAccount } from '../../src/modules/accounts/account.service.js';

const products = [
  {
    product_code: 'SAV_VOLUNTARY',
    category: 'SAVINGS',
    financial_category: 'VOLUNTARY_SAVINGS',
    product_kind: 'STANDARD',
    guardian_required: 0,
    commodity_required: 0,
    target_required: 0,
    interest_method: 'STANDARD',
    is_active: 1
  },
  {
    product_code: 'SAV_COMPULSORY',
    category: 'SAVINGS',
    financial_category: 'COMPULSORY_SAVINGS',
    product_kind: 'STANDARD',
    guardian_required: 0,
    commodity_required: 0,
    target_required: 0,
    interest_method: 'PROFIT_SHARING',
    is_active: 1
  },
  {
    product_code: 'SHR_CAP',
    category: 'SHARES',
    financial_category: 'SHARE_CAPITAL',
    product_kind: 'STANDARD',
    guardian_required: 0,
    commodity_required: 0,
    target_required: 0,
    interest_method: 'PROFIT_SHARING',
    is_active: 1
  }
];

function connectionWith(existing = []) {
  const insertedAccounts = [];
  return {
    insertedAccounts,
    query: jest.fn(async (sql, params) => {
      if (sql.includes('FROM members')) return [[{ member_id: 'member-1', status: 'PENDING' }], null];
      if (sql.includes('FROM account_products')) {
        const requested = new Set(params);
        return [products.filter((product) => requested.has(product.product_code)), null];
      }
      if (sql.includes('FROM accounts')) return [existing, null];
      throw new Error(`Unexpected query: ${sql}`);
    }),
    execute: jest.fn(async (sql, params) => {
      if (sql.includes('INSERT INTO accounts')) {
        insertedAccounts.push({ account_id: params[0], product_code: params[2] });
      }
      return [{ affectedRows: 1 }, null];
    })
  };
}

describe('default member savings accounts', () => {
  test('creates voluntary and compulsory savings by default', async () => {
    const connection = connectionWith();
    const result = await ensureMemberSavingsAccounts(
      'member-1',
      undefined,
      { userId: 'teller-1' },
      connection
    );

    expect(result.created.map((account) => account.product_code)).toEqual([
      'SAV_VOLUNTARY',
      'SAV_COMPULSORY'
    ]);
    expect(connection.insertedAccounts).toHaveLength(2);
  });

  test('skips an existing account and creates only the missing default', async () => {
    const connection = connectionWith([{ account_id: 'existing-1', product_code: 'SAV_COMPULSORY' }]);
    const result = await ensureMemberSavingsAccounts(
      'member-1',
      ['SAV_VOLUNTARY', 'SAV_COMPULSORY'],
      { userId: 'teller-1' },
      connection
    );

    expect(result.existing).toEqual(['SAV_COMPULSORY']);
    expect(result.created.map((account) => account.product_code)).toEqual(['SAV_VOLUNTARY']);
    expect(connection.insertedAccounts).toHaveLength(1);
  });

  test('rejects an explicitly selected missing or non-savings product', async () => {
    const connection = connectionWith();
    await expect(ensureMemberSavingsAccounts(
      'member-1',
      ['LOAN_PRODUCT'],
      { userId: 'teller-1' },
      connection
    )).rejects.toMatchObject({ status: 400 });
    expect(connection.insertedAccounts).toHaveLength(0);
  });
});

describe('default Share Capital account', () => {
  test('creates one zero-value SHR_CAP account without posting ownership', async () => {
    const connection = connectionWith();
    const result = await ensureMemberShareAccount('member-1', { userId: 'teller-1' }, connection);
    expect(result.created).toBe(true);
    expect(connection.insertedAccounts).toEqual([
      expect.objectContaining({ product_code: 'SHR_CAP' })
    ]);
  });

  test('does not create a second active SHR_CAP account', async () => {
    const connection = connectionWith([{ account_id: 'share-existing', product_code: 'SHR_CAP' }]);
    const result = await ensureMemberShareAccount('member-1', { userId: 'teller-1' }, connection);
    expect(result).toEqual({ created: false, account_id: 'share-existing' });
    expect(connection.insertedAccounts).toHaveLength(0);
  });

  test('blocks duplicate active SHR_CAP accounts instead of guessing', async () => {
    const connection = connectionWith([
      { account_id: 'share-1', product_code: 'SHR_CAP' },
      { account_id: 'share-2', product_code: 'SHR_CAP' }
    ]);
    await expect(ensureMemberShareAccount('member-1', { userId: 'teller-1' }, connection))
      .rejects.toMatchObject({ status: 409 });
  });
});
