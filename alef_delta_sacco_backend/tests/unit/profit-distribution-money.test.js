import { allocateLargestRemainder, centsToEtb, etbToCents } from '../../src/modules/profit-distributions/money.js';

describe('profit distribution exact money calculations', () => {
  test('converts ETB without floating-point loss', () => {
    expect(etbToCents('100000.01')).toBe(10000001n);
    expect(centsToEtb(10000001n)).toBe('100000.01');
    expect(centsToEtb(-1n)).toBe('-0.01');
  });

  test('rejects values with more than two decimal places', () => {
    expect(() => etbToCents('1.001')).toThrow('Invalid ETB amount');
  });

  test('largest-remainder allocation preserves every cent', () => {
    const result = allocateLargestRemainder(10000n, [
      { id: 'member-a', weight: 1n },
      { id: 'member-b', weight: 1n },
      { id: 'member-c', weight: 1n }
    ]);
    expect([...result.values()].reduce((sum, amount) => sum + amount, 0n)).toBe(10000n);
    expect(result.get('member-a')).toBe(3334n);
    expect(result.get('member-b')).toBe(3333n);
    expect(result.get('member-c')).toBe(3333n);
  });

  test('allocates the documented 49/8/30/remaining policy exactly', () => {
    const result = allocateLargestRemainder(10000000n, [
      { id: 'reserve', weight: 3000n },
      { id: 'shares', weight: 4900n },
      { id: 'savings', weight: 800n },
      { id: 'internal', weight: 1300n }
    ]);
    expect(centsToEtb(result.get('reserve'))).toBe('30000.00');
    expect(centsToEtb(result.get('shares'))).toBe('49000.00');
    expect(centsToEtb(result.get('savings'))).toBe('8000.00');
    expect(centsToEtb(result.get('internal'))).toBe('13000.00');
  });
});
