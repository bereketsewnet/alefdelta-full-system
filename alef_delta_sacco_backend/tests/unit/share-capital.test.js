import {
  SHARE_UNIT_SCALE,
  calculatePurchaseUnits,
  etbToCents,
  microsToUnits,
  unitsToMicros
} from '../../src/modules/shares/share-money.js';
import { allocateRedemption, assertPurchaseAllowed, assertRedemptionAllowed, assertShareLedgerConsistency } from '../../src/modules/shares/share.service.js';
import { allocateLargestRemainder } from '../../src/modules/profit-distributions/money.js';

function lot({ id, amount, units, price }) {
  return {
    lot_id: id,
    purchase_price: price,
    remainingAmountCents: etbToCents(amount),
    remainingUnitMicros: unitsToMicros(units)
  };
}

describe('fractional share capital math', () => {
  test('ETB 1,000 at ETB 300 creates 3.33333333 units', () => {
    expect(microsToUnits(calculatePurchaseUnits(etbToCents('1000.00'), etbToCents('300.00')))).toBe('3.33333333');
  });

  test('later price changes apply only to the new purchase', () => {
    const first = calculatePurchaseUnits(etbToCents('1000.00'), etbToCents('300.00'));
    const second = calculatePurchaseUnits(etbToCents('500.00'), etbToCents('500.00'));
    expect(microsToUnits(first)).toBe('3.33333333');
    expect(microsToUnits(first + second)).toBe('4.33333333');
  });

  test('FIFO redemption uses original paid values across price lots', () => {
    const allocations = allocateRedemption([
      lot({ id: 'old', amount: '600.00', units: '2.00000000', price: '300.00' }),
      lot({ id: 'new', amount: '1000.00', units: '2.00000000', price: '500.00' })
    ], etbToCents('800.00'));
    expect(allocations.map((row) => ({ id: row.lot.lot_id, amount: row.amountCents, units: row.unitsMicros }))).toEqual([
      { id: 'old', amount: etbToCents('600.00'), units: unitsToMicros('2.00000000') },
      { id: 'new', amount: etbToCents('200.00'), units: unitsToMicros('0.40000000') }
    ]);
  });

  test('full lot redemption consumes exact units without precision dust', () => {
    const allocations = allocateRedemption([
      lot({ id: 'repeating', amount: '1000.00', units: '3.33333333', price: '300.00' })
    ], etbToCents('1000.00'));
    expect(allocations[0].unitsMicros).toBe(unitsToMicros('3.33333333'));
  });

  test('redemption cannot exceed the original contributed value in FIFO lots', () => {
    expect(() => allocateRedemption([
      lot({ id: 'only', amount: '600.00', units: '2.00000000', price: '300.00' })
    ], etbToCents('600.01'))).toThrow(/Insufficient contributed share capital/);
  });

  test('fractional dividend weights allocate every cent exactly', () => {
    const result = allocateLargestRemainder(490000n, [
      { id: 'A', weight: unitsToMicros('3.33333333') },
      { id: 'B', weight: unitsToMicros('6.66666667') }
    ]);
    expect(result.get('A') + result.get('B')).toBe(490000n);
    expect(result.get('A')).toBe(163333n);
    expect(result.get('B')).toBe(326667n);
  });

  test('posting is blocked when account money or units do not reconcile to the append-only ledger', async () => {
    const connection = {
      query: async () => [[{ entry_count: 1, ledger_balance: '900.00', ledger_units: '3.33333333' }]]
    };
    await expect(assertShareLedgerConsistency({
      account_id: 'share-account',
      balance: '1000.00',
      share_unit_balance: '3.33333333'
    }, connection)).rejects.toMatchObject({ status: 409 });
  });

  test('a fully reconciled account is accepted for posting', async () => {
    const connection = {
      query: async () => [[{ entry_count: 1, ledger_balance: '1000.00', ledger_units: '3.33333333' }]]
    };
    await expect(assertShareLedgerConsistency({
      account_id: 'share-account',
      balance: '1000.00',
      share_unit_balance: '3.33333333'
    }, connection)).resolves.toBeUndefined();
  });

  test('unit scale remains eight decimal places', () => {
    expect(SHARE_UNIT_SCALE).toBe(100000000n);
  });

  test.each([
    [{ status: 'FROZEN', member_status: 'ACTIVE' }, assertPurchaseAllowed, /frozen account/],
    [{ status: 'CLOSED', member_status: 'ACTIVE' }, assertPurchaseAllowed, /closed account/],
    [{ status: 'ACTIVE', member_status: 'INACTIVE' }, assertPurchaseAllowed, /ACTIVE member/],
    [{ status: 'FROZEN', member_status: 'ACTIVE' }, assertRedemptionAllowed, /frozen account/],
    [{ status: 'CLOSED', member_status: 'ACTIVE' }, assertRedemptionAllowed, /closed account/],
    [{ status: 'ACTIVE', member_status: 'INACTIVE' }, assertRedemptionAllowed, /ACTIVE member/]
  ])('blocks invalid account or member state %#', (account, assertion, message) => {
    expect(() => assertion(account)).toThrow(message);
  });
});
