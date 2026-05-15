import dayjs from 'dayjs';

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
  const { installment, monthlyRate } = calculateInstallment({
    principal,
    interestRate,
    interestType: 'DECLINING',
    termMonths
  });
  const rows = [];
  let balance = principal;
  for (let i = 1; i <= termMonths; i += 1) {
    const interestComponent = balance * monthlyRate;
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

export function runGatekeeper(member, payload, product) {
  // Ensure all values are numbers and have defaults
  const appliedAmount = Number(payload.applied_amount) || 0;
  const interestRate = Number(payload.interest_rate || product?.interest_rate) || 0;
  const interestType = payload.interest_type || product?.interest_type || 'FLAT';
  const termMonths = Number(payload.term_months) || 1;
  const monthlyIncome = Number(member.monthly_income) || 0;

  // Only calculate installment if we have valid loan amount
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
    { name: 'status', pass: member.status === 'ACTIVE' },
    { name: 'income', pass: monthlyIncome > 0 },
    {
      name: 'affordability',
      pass: installmentInfo.installment <= maxInstallment || member.member_type === 'SME',
      data: { 
        installment: installmentInfo.installment, 
        maxInstallment: maxInstallment,
        appliedAmount: appliedAmount,
        interestRate: interestRate,
        termMonths: termMonths
      }
    }
  ];
  return { passed: checks.every((c) => c.pass), checks, installment: installmentInfo.installment, maxInstallment };
}

export function buildSchedule(loan, startDate) {
  if (loan.interest_type === 'DECLINING') {
    return buildScheduleDeclining(
      loan.approved_amount || loan.applied_amount,
      loan.interest_rate,
      loan.term_months,
      startDate
    );
  }
  return buildScheduleFlat(
    loan.approved_amount || loan.applied_amount,
    loan.interest_rate,
    loan.term_months,
    startDate
  );
}

