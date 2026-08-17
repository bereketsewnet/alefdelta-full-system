import dayjs from 'dayjs';

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function frequencyDetails(termMonths, frequency = 'MONTHLY') {
  if (frequency === 'WEEKLY') return { periods: Math.max(1, Math.round(Number(termMonths) * 52 / 12)), unit: 'week', step: 1, periodicRateDivisor: 52 };
  if (frequency === 'QUARTERLY') return { periods: Math.max(1, Math.ceil(Number(termMonths) / 3)), unit: 'month', step: 3, periodicRateDivisor: 4 };
  return { periods: Math.max(1, Number(termMonths)), unit: 'month', step: 1, periodicRateDivisor: 12 };
}

export function calculateDecliningInstallment({ principal, annualRate, termMonths, frequency = 'MONTHLY' }) {
  const details = frequencyDetails(termMonths, frequency);
  const rate = Number(annualRate || 0) / 100 / details.periodicRateDivisor;
  const amount = Number(principal);
  if (rate === 0) return money(amount / details.periods);
  return money((amount * rate * (1 + rate) ** details.periods) / ((1 + rate) ** details.periods - 1));
}

// The last row is adjusted by cents so scheduled principal is always exactly the loan principal.
export function buildDecliningSchedule({ principal, annualRate, termMonths, frequency = 'MONTHLY', firstDueDate, installment: fixedInstallment }) {
  const details = frequencyDetails(termMonths, frequency);
  const periodicRate = Number(annualRate || 0) / 100 / details.periodicRateDivisor;
  const installment = money(fixedInstallment ?? calculateDecliningInstallment({ principal, annualRate, termMonths, frequency }));
  let balance = money(principal);
  const rows = [];
  for (let number = 1; number <= details.periods && balance > 0; number += 1) {
    const interest = money(balance * periodicRate);
    const principalPart = number === details.periods ? balance : Math.min(balance, money(installment - interest));
    const payment = money(principalPart + interest);
    const closing = money(Math.max(0, balance - principalPart));
    rows.push({
      installment_no: number,
      due_date: dayjs(firstDueDate).add((number - 1) * details.step, details.unit).format('YYYY-MM-DD'),
      opening_balance: balance,
      scheduled_payment: payment,
      scheduled_principal: principalPart,
      scheduled_interest: interest,
      closing_balance: closing
    });
    balance = closing;
  }
  return rows;
}

export const roundMoney = money;
