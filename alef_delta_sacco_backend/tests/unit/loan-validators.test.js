import { describe, expect, it } from '@jest/globals';
import { checkEligibilitySchema } from '../../src/modules/loans/loan.validators.js';
import { updateLoanProductSchema } from '../../src/modules/loan-products/loan-product.validators.js';

const compatibilityTierId = 'a883b71d-9a47-11f1-99e6-7e0b432c7d55';

describe('loan tier UUID compatibility', () => {
  it('accepts MySQL UUID v1 IDs for existing compatibility tiers during eligibility checks', () => {
    const { error } = checkEligibilitySchema.validate({
      member_id: 'member-1',
      product_code: 'DEV_GROWTH',
      selected_tier_id: compatibilityTierId,
      applied_amount: 100,
      term_months: 1
    });
    expect(error).toBeUndefined();
  });

  it('accepts existing compatibility tier IDs when editing a loan product', () => {
    const { error } = updateLoanProductSchema.validate({
      tiers: [{
        tier_id: compatibilityTierId,
        tier_code: 'DEFAULT',
        name: 'Default Tier',
        min_savings_duration_months: 0,
        loan_amount_min_etb: 0,
        loan_amount_max_etb: null,
        max_term_months: 24,
        interest_rate: 12,
        required_pre_savings_pct: 0,
        required_share_purchase_pct: 0,
        eligible_savings_products: ['SAV_COMPULSORY']
      }]
    });
    expect(error).toBeUndefined();
  });
});
