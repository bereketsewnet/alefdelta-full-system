import { describe, it, expect } from '@jest/globals';
import dayjs from 'dayjs';
import { calculateInstallment, runGatekeeper, etbToCents, percentOfCents } from '../../src/modules/loans/gatekeeper.js';

const memberFixture = {
  status: 'ACTIVE',
  monthly_income: 30000,
  member_type: 'GOV_EMP'
};

const productFixture = {
  interest_rate: 12,
  interest_type: 'DECLINING',
  min_term_months: 1
};

const tierFixture = {
  tier_id: 'tier-1', product_code: 'LOAN', tier_code: 'T1', name: 'Tier 1',
  interest_rate: 12, min_savings_duration_months: 3, loan_amount_min_etb: 0,
  loan_amount_max_etb: 1000000, max_term_months: 24, required_pre_savings_pct: 10,
  required_share_purchase_pct: 10, eligible_savings_products: ['SAV_COMPULSORY'], is_active: true
};

const account = (productCode, balance, category, createdAt = '2025-01-01') => ({
  product_code: productCode, balance, financial_category: category, created_at: createdAt, status: 'ACTIVE'
});

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
    }, productFixture, tierFixture, [], dayjs('2026-08-17'));
    expect(outcome.passed).toBe(false);
    const affordabilityCheck = outcome.checks.find((c) => c.name === 'affordability');
    expect(affordabilityCheck.pass).toBe(false);
  });

  it('rounds ETB percentages to the nearest cent without floating point drift', () => {
    expect(etbToCents('100000.00')).toBe(10000000);
    expect(percentOfCents(etbToCents('123.45'), '10.25')).toBe(1265);
  });

  it('subtracts accumulated Share Capital from the required share amount', () => {
    const result = runGatekeeper(memberFixture, { applied_amount: 100000, term_months: 12 }, productFixture, tierFixture, [
      account('SAV_COMPULSORY', 10000, 'COMPULSORY_SAVINGS'),
      account('SHR_CAP', 3000, 'SHARE_CAPITAL')
    ], dayjs('2026-08-17'));
    expect(result.breakdown.required_share_amount).toBe(10000);
    expect(result.breakdown.accumulated_share_balance).toBe(3000);
    expect(result.breakdown.share_deficit).toBe(7000);
  });

  it('never creates a negative share deficit', () => {
    const result = runGatekeeper(memberFixture, { applied_amount: 100000, term_months: 12 }, productFixture, tierFixture, [
      account('SAV_COMPULSORY', 10000, 'COMPULSORY_SAVINGS'),
      account('SHR_CAP', 15000, 'SHARE_CAPITAL')
    ], dayjs('2026-08-17'));
    expect(result.breakdown.share_deficit).toBe(0);
  });

  it('excludes voluntary savings even when their balance would satisfy the requirement', () => {
    const result = runGatekeeper(memberFixture, { applied_amount: 100000, term_months: 12 }, productFixture, tierFixture, [
      account('SAV_COMPULSORY', 8000, 'COMPULSORY_SAVINGS'),
      account('SAV_VOLUNTARY', 50000, 'VOLUNTARY_SAVINGS'),
      account('SHR_CAP', 10000, 'SHARE_CAPITAL')
    ], dayjs('2026-08-17'));
    expect(result.breakdown.eligible_savings_balance).toBe(8000);
    expect(result.breakdown.savings_deficit).toBe(2000);
    expect(result.checks.find((check) => check.name === 'pre_savings').pass).toBe(false);
  });

  it('adds compulsory savings and share deficits into the upfront total', () => {
    const result = runGatekeeper(memberFixture, { applied_amount: 100000, term_months: 12 }, productFixture, tierFixture, [
      account('SAV_COMPULSORY', 8000, 'COMPULSORY_SAVINGS'),
      account('SHR_CAP', 3000, 'SHARE_CAPITAL')
    ], dayjs('2026-08-17'));
    expect(result.breakdown.savings_deficit).toBe(2000);
    expect(result.breakdown.share_deficit).toBe(7000);
    expect(result.breakdown.total_upfront_deficit).toBe(9000);
  });

  it('uses completed calendar months from the oldest eligible account', () => {
    const result = runGatekeeper(memberFixture, { applied_amount: 100000, term_months: 12 }, productFixture, tierFixture, [
      account('SAV_COMPULSORY', 10000, 'COMPULSORY_SAVINGS', '2026-05-18'),
      account('SHR_CAP', 10000, 'SHARE_CAPITAL')
    ], dayjs('2026-08-17'));
    expect(result.breakdown.savings_duration_months).toBe(2);
    expect(result.checks.find((check) => check.name === 'savings_duration').pass).toBe(false);
  });
});
