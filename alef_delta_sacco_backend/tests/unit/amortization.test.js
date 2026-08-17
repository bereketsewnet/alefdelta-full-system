import { buildDecliningSchedule } from '../../src/modules/loans/amortization.js';

describe('declining-balance amortization', () => {
  test('keeps the regular installment fixed while interest falls and principal totals exactly the loan', () => {
    const schedule = buildDecliningSchedule({ principal: 100000, annualRate: 12, termMonths: 12, firstDueDate: '2026-09-11' });
    expect(schedule).toHaveLength(12);
    expect(schedule[0].scheduled_payment).toBe(8884.88);
    expect(schedule[0].scheduled_interest).toBeGreaterThan(schedule[11].scheduled_interest);
    expect(schedule[0].scheduled_principal).toBeLessThan(schedule[11].scheduled_principal);
    expect(schedule.reduce((sum, row) => sum + row.scheduled_principal, 0)).toBe(100000);
    expect(schedule.at(-1).closing_balance).toBe(0);
  });
});
