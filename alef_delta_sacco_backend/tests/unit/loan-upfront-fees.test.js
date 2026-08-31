import { calculateUpfrontLoanFees } from '../../src/modules/loans/loan.service.js';

describe('loan upfront fee calculation', () => {
  test('deducts service charge and insurance from the amount delivered', () => {
    expect(calculateUpfrontLoanFees({
      principal: '100000.00', serviceCharge: '3000.00', insurancePremium: '2000.00', paymentMethod: 'DEDUCT_FROM_LOAN'
    })).toEqual({
      grossDisbursement: '100000.00', serviceCharge: '3000.00', insurancePremium: '2000.00',
      totalUpfrontFees: '5000.00', netDisbursement: '95000.00'
    });
  });

  test('out-of-pocket fees preserve the full disbursement', () => {
    expect(calculateUpfrontLoanFees({
      principal: '100000.00', serviceCharge: '3000.00', insurancePremium: '2000.00', paymentMethod: 'OUT_OF_POCKET'
    }).netDisbursement).toBe('100000.00');
  });

  test('rejects a deduction that consumes the principal', () => {
    expect(() => calculateUpfrontLoanFees({
      principal: '5000.00', serviceCharge: '3000.00', insurancePremium: '2000.00', paymentMethod: 'DEDUCT_FROM_LOAN'
    })).toThrow('Upfront fees must be less than the approved loan amount');
  });
});
