import { query, execute } from '../../core/db.js';

export function calculateLoanInsurance({ age, termMonths, maritalStatus, principal, enabled = true, discountPct = 0 }) {
  if (!enabled) return { enabled: false, ceilingRate: 0, rate: 0, premium: 0, annualRenewalRequired: false, renewalMonths: null };
  if (!Number.isInteger(Number(age)) || Number(age) < 18) throw new Error('Borrower must be at least 18 years old for loan insurance');
  if (Number(termMonths) < 1 || Number(termMonths) > 120) throw new Error('Loan term must be between 1 month and 10 years for loan insurance');
  const married = maritalStatus === 'MARRIED';
  const years = Number(termMonths) / 12;
  const ageRates = Number(age) <= 45 ? [[1.5, 1.95], [1.75, 2.3], [2.05, 2.8]] : Number(age) <= 60 ? [[1.95, 2.55], [2.05, 2.85], [2.5, 3.3]] : [[2.5, 3.3], [2.6, 3.5], [2.8, 3.8]];
  const bracket = years <= 1 ? 0 : years <= 5 ? 1 : 2;
  const ceilingRate = ageRates[bracket][married ? 1 : 0];
  const rate = Math.max(0, Number((ceilingRate - Number(discountPct || 0)).toFixed(2)));
  return { enabled: true, ceilingRate, rate, premium: Number((Number(principal) * rate / 100).toFixed(2)), annualRenewalRequired: Number(termMonths) > 12, renewalMonths: Number(termMonths) > 12 ? 12 : null };
}

export async function getInsuranceMatrix() { return query('SELECT * FROM loan_insurance_rate_matrix ORDER BY age_min, term_min_months, marital_status'); }
export async function updateInsuranceRate(rateId, configuredRate) {
  const rows = await query('SELECT * FROM loan_insurance_rate_matrix WHERE rate_id = ?', [rateId]);
  const row = rows[0]; if (!row) throw new Error('Insurance rate row not found');
  const value = Number(configuredRate); if (!Number.isFinite(value) || value < 0 || value > Number(row.ceiling_rate)) throw new Error(`Configured rate must be between 0 and the ceiling of ${row.ceiling_rate}%`);
  await execute('UPDATE loan_insurance_rate_matrix SET configured_rate = ? WHERE rate_id = ?', [value, rateId]); return (await query('SELECT * FROM loan_insurance_rate_matrix WHERE rate_id = ?', [rateId]))[0];
}
export async function quoteLoanInsurance({ age, termMonths, maritalStatus, principal, enabled = true }) {
  if (!enabled) return { enabled: false, ceilingRate: 0, rate: 0, premium: 0, annualRenewalRequired: false };
  if (!Number.isInteger(Number(age)) || Number(age) < 18) throw new Error('Borrower must be at least 18 years old for loan insurance');
  if (Number(termMonths) < 1 || Number(termMonths) > 120) throw new Error('Loan term must be between 1 month and 10 years for loan insurance');
  const rows = await query(`SELECT * FROM loan_insurance_rate_matrix WHERE age_min <= ? AND (age_max IS NULL OR age_max >= ?) AND term_min_months <= ? AND term_max_months >= ? AND marital_status = ?`, [age, age, termMonths, termMonths, maritalStatus]);
  const row = rows[0]; if (!row) throw new Error('No configured insurance rate matches this borrower');
  const rate = Number(row.configured_rate); return { enabled: true, ceilingRate: Number(row.ceiling_rate), rate, premium: Number((Number(principal) * rate / 100).toFixed(2)), annualRenewalRequired: Number(termMonths) > 12, clauseReference: row.clause_reference };
}
