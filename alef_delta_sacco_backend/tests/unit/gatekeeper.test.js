import { describe, it, expect } from '@jest/globals';
import { calculateInstallment, runGatekeeper } from '../../src/modules/loans/gatekeeper.js';

const memberFixture = {
  status: 'ACTIVE',
  monthly_income: 30000,
  member_type: 'GOV_EMP'
};

const productFixture = {
  interest_rate: 12,
  interest_type: 'FLAT'
};

describe('Gatekeeper utilities', () => {
  it('calculates flat installments deterministically', () => {
    const result = calculateInstallment({
      principal: 120000,
      interestRate: 12,
      interestType: 'FLAT',
      termMonths: 12
    });
    expect(result.installment).toBeCloseTo(11200, 0);
  });

  it('blocks loans when installment exceeds one third of income', () => {
    const outcome = runGatekeeper(memberFixture, {
      applied_amount: 500000,
      interest_rate: 12,
      interest_type: 'FLAT',
      term_months: 12
    }, productFixture);
    expect(outcome.passed).toBe(false);
    const affordabilityCheck = outcome.checks.find((c) => c.name === 'affordability');
    expect(affordabilityCheck.pass).toBe(false);
  });
});
