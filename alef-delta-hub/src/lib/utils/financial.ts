// Financial calculation utilities based on SACCO spec

/**
 * Format currency in Ethiopian Birr
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? `ETB ${formatted}` : formatted;
}

/**
 * Calculate loan interest using FLAT method
 * Formula: Total Interest = Principal * Rate * (Term/12)
 */
export function calculateFlatInterest(
  principal: number,
  annualRate: number,
  termMonths: number
): {
  totalInterest: number;
  totalRepayment: number;
  monthlyInstallment: number;
} {
  // Ensure all inputs are numbers
  const p = Number(principal) || 0;
  const r = Number(annualRate) || 0;
  const t = Number(termMonths) || 1;
  
  const totalInterest = p * (r / 100) * (t / 12);
  const totalRepayment = p + totalInterest;
  const monthlyInstallment = t > 0 ? totalRepayment / t : 0;

  return {
    totalInterest: Number(totalInterest.toFixed(2)),
    totalRepayment: Number(totalRepayment.toFixed(2)),
    monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
  };
}

/**
 * Calculate loan interest using DECLINING BALANCE method
 * Monthly Rate = Annual Rate / 12
 * Monthly Payment = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateDecliningInterest(
  principal: number,
  annualRate: number,
  termMonths: number
): {
  totalInterest: number;
  totalRepayment: number;
  monthlyInstallment: number;
} {
  // Ensure all inputs are numbers
  const p = Number(principal) || 0;
  const r = Number(annualRate) || 0;
  const t = Number(termMonths) || 1;
  
  if (p === 0 || t === 0) {
    return {
      totalInterest: 0,
      totalRepayment: 0,
      monthlyInstallment: 0,
    };
  }
  
  const monthlyRate = r / 100 / 12;
  const denominator = Math.pow(1 + monthlyRate, t) - 1;
  
  if (denominator === 0 || !isFinite(denominator)) {
    return {
      totalInterest: 0,
      totalRepayment: p,
      monthlyInstallment: p / t,
    };
  }
  
  const monthlyInstallment =
    (p * (monthlyRate * Math.pow(1 + monthlyRate, t))) / denominator;

  const totalRepayment = monthlyInstallment * t;
  const totalInterest = totalRepayment - p;

  return {
    totalInterest: Number(totalInterest.toFixed(2)),
    totalRepayment: Number(totalRepayment.toFixed(2)),
    monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
  };
}

/**
 * Calculate affordability check (1/3 rule for salaried members)
 */
export function checkAffordability(
  monthlyIncome: number,
  loanAmount: number,
  termMonths: number,
  annualRate: number,
  interestType: "FLAT" | "DECLINING"
): {
  affordable: boolean;
  maxInstallment: number;
  monthlyInstallment: number;
  message?: string;
} {
  // Ensure all inputs are numbers
  const income = Number(monthlyIncome) || 0;
  const amount = Number(loanAmount) || 0;
  const term = Number(termMonths) || 1;
  const rate = Number(annualRate) || 0;
  
  const calcResult = interestType === "FLAT"
    ? calculateFlatInterest(amount, rate, term)
    : calculateDecliningInterest(amount, rate, term);
  
  const monthlyInstallment = calcResult.monthlyInstallment || 0;
  const maxInstallment = income / 3;
  const affordable = monthlyInstallment <= maxInstallment;

  return {
    affordable,
    maxInstallment: Number(maxInstallment.toFixed(2)),
    monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
    message: affordable
      ? "Installment is within 1/3 of monthly income"
      : `Installment ${formatCurrency(monthlyInstallment)} exceeds 1/3 of income (${formatCurrency(maxInstallment)})`,
  };
}

/**
 * Calculate eligibility (Gatekeeper checks)
 * @param member - Member object
 * @param loanAmount - Requested loan amount
 */
export function checkEligibility(
  member: { registered_date: string; status: string },
  loanAmount: number
): {
  eligible: boolean;
  membershipActive: boolean;
  noActiveDefault: boolean;
  sufficientSavings: boolean;
  message?: string;
} {
  // Rule 1: Membership must be ACTIVE
  const membershipActive = member.status === "ACTIVE";

  // Rule 2: No active defaults (simulated - in real system would check delinquency)
  const noActiveDefault = true; // Simplified for now

  // Rule 3: Must have sufficient savings (10% of loan amount)
  const requiredSavings = loanAmount * 0.1;
  // Simplified: assume they have enough if they're active
  const sufficientSavings = membershipActive;

  const eligible = membershipActive && noActiveDefault && sufficientSavings;

  const messages: string[] = [];
  if (!membershipActive) messages.push("Member is not ACTIVE");
  if (!noActiveDefault) messages.push("Has active defaults");
  if (!sufficientSavings) messages.push(`Requires ${formatCurrency(requiredSavings)} in savings`);

  return {
    eligible,
    membershipActive,
    noActiveDefault,
    sufficientSavings,
    message: messages.length > 0 ? messages.join("; ") : "All checks passed",
  };
}

/**
 * Generate idempotency key for transactions
 */
export function generateIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate available balance (balance - lien_amount)
 */
export function calculateAvailableBalance(
  balance: number,
  lienAmount: number
): number {
  return Number((balance - lienAmount).toFixed(2));
}

/**
 * Validate withdrawal amount
 */
export function validateWithdrawal(
  balance: number,
  lienAmount: number,
  withdrawalAmount: number
): { valid: boolean; message?: string } {
  const availableBalance = calculateAvailableBalance(balance, lienAmount);

  if (withdrawalAmount <= 0) {
    return { valid: false, message: "Withdrawal amount must be positive" };
  }

  if (withdrawalAmount > availableBalance) {
    return {
      valid: false,
      message: `Insufficient funds. Available: ${formatCurrency(availableBalance)}`,
    };
  }

  return { valid: true };
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
