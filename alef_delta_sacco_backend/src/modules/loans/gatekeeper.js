import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { buildDecliningSchedule } from './amortization.js';
dayjs.extend(utc);

function calculateDecliningInstallment(principal, monthlyRate, termMonths) {
  if (monthlyRate === 0) {
    return principal / termMonths;
  }
  return (
    (principal * monthlyRate * (1 + monthlyRate) ** termMonths) /
    ((1 + monthlyRate) ** termMonths - 1)
  );
}

export function calculateInstallment({ principal, interestRate, interestType, termMonths }) {
  const monthlyRate = Number(interestRate) / 100 / 12;
  let installment;
  if (interestType === 'DECLINING') {
    installment = calculateDecliningInstallment(principal, monthlyRate, termMonths);
  } else {
    const totalInterest = principal * (Number(interestRate) / 100);
    installment = (principal + totalInterest) / termMonths;
  }
  return {
    installment: Number(installment.toFixed(2)),
    monthlyRate
  };
}

export function buildScheduleFlat(principal, interestRate, termMonths, startDate) {
  const totalInterest = principal * (interestRate / 100);
  const installment = (principal + totalInterest) / termMonths;
  const rows = [];
  let balance = principal;
  for (let i = 1; i <= termMonths; i += 1) {
    const interestComponent = totalInterest / termMonths;
    const principalComponent = installment - interestComponent;
    balance -= principalComponent;
    rows.push({
      period: i,
      due_date: dayjs(startDate).add(i - 1, 'month').format('YYYY-MM-DD'),
      installment: Number(installment.toFixed(2)),
      principal_component: Number(principalComponent.toFixed(2)),
      interest_component: Number(interestComponent.toFixed(2)),
      balance: Number(Math.max(balance, 0).toFixed(2))
    });
  }
  return rows;
}

export function buildScheduleDeclining(principal, interestRate, termMonths, startDate) {
  return buildDecliningSchedule({ principal, annualRate: interestRate, termMonths, firstDueDate: startDate })
    .map((row) => ({ period: row.installment_no, installment: row.scheduled_payment, principal_component: row.scheduled_principal, interest_component: row.scheduled_interest, balance: row.closing_balance, due_date: row.due_date }));
}

export function etbToCents(value) {
  const normalized = String(value ?? 0).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return 0;
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ''] = unsigned.split('.');
  const thirdDigit = Number((fraction + '000')[2]);
  let cents = (BigInt(whole || '0') * 100n) + BigInt((fraction + '00').slice(0, 2));
  if (thirdDigit >= 5) cents += 1n;
  return Number(negative ? -cents : cents);
}

export function percentageToBasisPoints(value) {
  return etbToCents(value);
}

export function percentOfCents(amountCents, percentage) {
  const basisPoints = BigInt(percentageToBasisPoints(percentage));
  const numerator = BigInt(amountCents) * basisPoints;
  return Number((numerator + 5000n) / 10000n);
}

function centsToAmount(cents) {
  return Number((cents / 100).toFixed(2));
}

function makeCheck(name, pass, message, data = {}) {
  return { name, pass, overrideable: true, message, data };
}

export function runGatekeeper(member, payload, product, tier, memberAccounts = [], evaluationDate = dayjs()) {
  const appliedAmount = Number(payload.applied_amount) || 0;
  const interestRate = Number(tier?.interest_rate ?? payload.interest_rate ?? product?.interest_rate) || 0;
  const interestType = 'DECLINING';
  const termMonths = Number(payload.term_months) || 1;
  const monthlyIncome = Number(member.monthly_income) || 0;

  let installmentInfo = { installment: 0, monthlyRate: 0 };
  if (appliedAmount > 0 && interestRate >= 0 && termMonths > 0) {
    installmentInfo = calculateInstallment({
      principal: appliedAmount,
      interestRate: interestRate,
      interestType: interestType,
      termMonths: termMonths
    });
  }

  const maxInstallment = monthlyIncome / 3;
  const checks = [
    makeCheck('status', member.status === 'ACTIVE', member.status === 'ACTIVE' ? 'Member status is ACTIVE.' : `Member status is ${member.status}; ACTIVE is required.`, { actual: member.status, required: 'ACTIVE' }),
    makeCheck('income', monthlyIncome > 0, monthlyIncome > 0 ? 'Member has a recorded monthly income.' : 'Member monthly income must be greater than zero.', { monthly_income: monthlyIncome }),
    makeCheck(
      'affordability',
      installmentInfo.installment <= maxInstallment || member.member_type === 'SME',
      installmentInfo.installment <= maxInstallment || member.member_type === 'SME'
        ? 'Estimated installment satisfies the affordability rule.'
        : `Estimated installment ETB ${installmentInfo.installment.toFixed(2)} exceeds the allowed ETB ${maxInstallment.toFixed(2)}.`,
      {
        installment: installmentInfo.installment,
        maxInstallment: maxInstallment,
        appliedAmount: appliedAmount,
        interestRate: interestRate,
        termMonths: termMonths
      }
    )
  ];

  const eligibleCodes = new Set(tier?.eligible_savings_products || []);
  const eligibleAccounts = memberAccounts.filter((account) =>
    account.financial_category === 'COMPULSORY_SAVINGS' && eligibleCodes.has(account.product_code)
  );
  const shareAccounts = memberAccounts.filter((account) => account.financial_category === 'SHARE_CAPITAL');
  const earliest = eligibleAccounts.reduce((min, account) => {
      const d = dayjs(account.created_at);
      return (!min || d.isBefore(min)) ? d : min;
    }, null);
  const monthsSaved = earliest ? evaluationDate.diff(earliest, 'month') : 0;

  if (tier) {
    const durationPassed = monthsSaved >= tier.min_savings_duration_months;
    checks.push(makeCheck(
      'savings_duration',
      durationPassed,
      durationPassed
        ? `Savings account age is ${monthsSaved} months; ${tier.min_savings_duration_months} months required.`
        : `Savings duration is short by ${tier.min_savings_duration_months - monthsSaved} month(s).`,
      { months_saved: monthsSaved, required: tier.min_savings_duration_months }
    ));

    const floorPassed = appliedAmount >= Number(tier.loan_amount_min_etb || 0);
    checks.push(makeCheck(
      'loan_floor',
      floorPassed,
      floorPassed ? 'Requested amount satisfies the tier minimum.' : `Requested amount is below the tier minimum of ETB ${Number(tier.loan_amount_min_etb).toFixed(2)}.`,
      { applied: appliedAmount, floor: Number(tier.loan_amount_min_etb || 0) }
    ));
    if (tier.loan_amount_max_etb != null) {
      const ceilingPassed = appliedAmount <= Number(tier.loan_amount_max_etb);
      checks.push(makeCheck(
        'loan_ceiling',
        ceilingPassed,
        ceilingPassed ? 'Requested amount is within the tier ceiling.' : `Requested amount exceeds the tier ceiling of ETB ${Number(tier.loan_amount_max_etb).toFixed(2)}.`,
        { applied: appliedAmount, ceiling: Number(tier.loan_amount_max_etb) }
      ));
    }
    const termPassed = termMonths >= Number(product.min_term_months || 1) && termMonths <= Number(tier.max_term_months);
    checks.push(makeCheck(
      'loan_term',
      termPassed,
      termPassed ? 'Requested term is within the selected tier.' : `Term must be between ${product.min_term_months} and ${tier.max_term_months} months.`,
      { actual: termMonths, minimum: Number(product.min_term_months || 1), maximum: Number(tier.max_term_months) }
    ));
  }

  const appliedCents = etbToCents(payload.applied_amount);
  const savingsBalanceCents = eligibleAccounts.reduce((sum, account) => sum + etbToCents(account.balance), 0);
  const requiredSavingsCents = percentOfCents(appliedCents, tier?.required_pre_savings_pct || 0);
  const savingsDeficitCents = Math.max(0, requiredSavingsCents - savingsBalanceCents);
  const shareBalanceCents = shareAccounts.reduce((sum, account) => sum + etbToCents(account.balance), 0);
  const requiredSharesCents = percentOfCents(appliedCents, tier?.required_share_purchase_pct || 0);
  const shareDeficitCents = Math.max(0, requiredSharesCents - shareBalanceCents);

  checks.push(makeCheck(
    'pre_savings',
    savingsDeficitCents === 0,
    savingsDeficitCents === 0
      ? 'Required compulsory savings balance is satisfied.'
      : `Compulsory savings are short by ETB ${centsToAmount(savingsDeficitCents).toFixed(2)}. Voluntary savings are not counted.`,
    { savings_balance: centsToAmount(savingsBalanceCents), required_balance: centsToAmount(requiredSavingsCents), deficit: centsToAmount(savingsDeficitCents), pct: Number(tier?.required_pre_savings_pct || 0), eligible_product_codes: [...eligibleCodes] }
  ));
  checks.push(makeCheck(
    'share_balance',
    shareDeficitCents === 0,
    shareDeficitCents === 0
      ? 'Required accumulated share balance is satisfied.'
      : `Share Capital is short by ETB ${centsToAmount(shareDeficitCents).toFixed(2)}.`,
    { share_balance: centsToAmount(shareBalanceCents), required_balance: centsToAmount(requiredSharesCents), deficit: centsToAmount(shareDeficitCents), pct: Number(tier?.required_share_purchase_pct || 0) }
  ));

  const breakdown = {
    requested_amount: centsToAmount(appliedCents),
    required_pre_savings_amount: centsToAmount(requiredSavingsCents),
    eligible_savings_balance: centsToAmount(savingsBalanceCents),
    savings_deficit: centsToAmount(savingsDeficitCents),
    required_share_amount: centsToAmount(requiredSharesCents),
    accumulated_share_balance: centsToAmount(shareBalanceCents),
    share_deficit: centsToAmount(shareDeficitCents),
    total_upfront_deficit: centsToAmount(savingsDeficitCents + shareDeficitCents),
    savings_duration_months: monthsSaved,
    eligible_savings_products: [...eligibleCodes]
  };

  return {
    passed: checks.every((check) => check.pass),
    override_required: checks.some((check) => !check.pass),
    selected_tier: tier,
    breakdown,
    checks,
    installment: installmentInfo.installment,
    maxInstallment
  };
}

export function buildSchedule(loan, startDate) {
  return buildScheduleDeclining(loan.approved_amount || loan.applied_amount, loan.interest_rate, loan.term_months, startDate);
}
