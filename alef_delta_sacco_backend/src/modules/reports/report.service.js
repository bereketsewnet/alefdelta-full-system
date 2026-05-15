import { query } from '../../core/db.js';

export async function getOperationalSummary() {
  const [memberStats] = await query("SELECT COUNT(*) AS total_members, SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_members FROM members");
  const [accountStats] = await query('SELECT COUNT(*) AS total_accounts, SUM(balance) AS total_balance FROM accounts');
  
  // Loans outstanding: Sum of approved amount for APPROVED and DISBURSED loans
  const [loanStats] = await query(
    `SELECT COUNT(*) AS total_loans, COALESCE(SUM(approved_amount), 0) AS total_outstanding 
     FROM loan_applications 
     WHERE workflow_status IN ('APPROVED', 'DISBURSED')`
  );
  
  // Calculate loan portfolio trend: current month vs last month
  const [currentMonthLoans] = await query(
    `SELECT COALESCE(SUM(approved_amount), 0) AS total
     FROM loan_applications 
     WHERE workflow_status IN ('APPROVED', 'DISBURSED')
     AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
  );
  
  const [lastMonthLoans] = await query(
    `SELECT COALESCE(SUM(approved_amount), 0) AS total
     FROM loan_applications 
     WHERE workflow_status IN ('APPROVED', 'DISBURSED')
     AND created_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
     AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01')`
  );
  
  const currentMonthValue = Number(currentMonthLoans.total || 0);
  const lastMonthValue = Number(lastMonthLoans.total || 0);
  let loanPortfolioTrend = 0;
  let isPositive = true;
  
  if (lastMonthValue > 0) {
    loanPortfolioTrend = ((currentMonthValue - lastMonthValue) / lastMonthValue) * 100;
    isPositive = loanPortfolioTrend >= 0;
  } else if (currentMonthValue > 0) {
    // If last month was 0 but current month has value, it's 100% increase
    loanPortfolioTrend = 100;
    isPositive = true;
  }
  
  const [pendingLoans] = await query(
    "SELECT COUNT(*) as count FROM loan_applications WHERE workflow_status IN ('PENDING', 'UNDER_REVIEW')"
  );

  // Calculate delinquency rate: loans in DEFAULT status / total disbursed loans
  const [delinquencyStats] = await query(
    `SELECT 
       SUM(CASE WHEN workflow_status = 'DEFAULT' THEN 1 ELSE 0 END) as default_count,
       COUNT(CASE WHEN workflow_status IN ('DISBURSED', 'DEFAULT') THEN 1 END) as total_disbursed
     FROM loan_applications`
  );

  const totalDisbursed = Number(delinquencyStats.total_disbursed || 0);
  const defaultCount = Number(delinquencyStats.default_count || 0);
  const delinquencyRate = totalDisbursed > 0 ? (defaultCount / totalDisbursed) * 100 : 0;

  // Monthly deposits (current month)
  const [monthlyStats] = await query(
    `SELECT SUM(amount) as monthly_deposits 
     FROM transactions 
     WHERE txn_type = 'DEPOSIT' 
     AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
  );

  return {
    total_savings: Number(accountStats.total_balance || 0),
    total_loans_outstanding: Number(loanStats.total_outstanding || 0),
    loan_portfolio_trend: Number(loanPortfolioTrend.toFixed(1)),
    loan_portfolio_trend_positive: isPositive,
    monthly_deposits: Number(monthlyStats.monthly_deposits || 0),
    delinquency_rate: Number(delinquencyRate.toFixed(2)),
    active_members: Number(memberStats.active_members || 0),
    pending_approvals: Number(pendingLoans.count || 0),
    // Keep original fields for compatibility if needed
    members: memberStats.total_members || 0,
    accounts: accountStats.total_accounts || 0
  };
}

export async function getTransactionReport(startDate, endDate) {
  const params = [];
  let querySql = `
    SELECT 
      t.txn_id,
      t.created_at as date,
      t.txn_type,
      t.amount,
      t.reference,
      t.balance_after,
      m.membership_no,
      CONCAT(m.first_name, ' ', m.last_name) as member_name,
      a.product_code
    FROM transactions t
    JOIN accounts a ON t.account_id = a.account_id
    JOIN members m ON a.member_id = m.member_id
    WHERE 1=1
  `;

  if (startDate) {
    querySql += ' AND t.created_at >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    querySql += ' AND t.created_at <= ?';
    params.push(endDate);
  }

  querySql += ' ORDER BY t.created_at DESC';

  const rows = await query(querySql, params);
  
  // Format for export
  return rows.map(row => ({
    "Transaction ID": row.txn_id,
    "Date": new Date(row.date).toLocaleString(),
    "Type": row.txn_type,
    "Amount": Number(row.amount),
    "Member": row.member_name,
    "Membership No": row.membership_no,
    "Account Product": row.product_code,
    "Reference": row.reference || '-',
    "Balance After": Number(row.balance_after)
  }));
}

export async function getLoanPortfolioReport() {
  const rows = await query(`
    SELECT 
      l.loan_id,
      l.product_code,
      l.applied_amount,
      l.approved_amount,
      l.term_months,
      l.interest_rate,
      l.workflow_status,
      l.disbursement_date,
      l.next_payment_date,
      CONCAT(m.first_name, ' ', m.last_name) as member_name,
      m.membership_no
    FROM loan_applications l
    JOIN members m ON l.member_id = m.member_id
    WHERE l.workflow_status IN ('DISBURSED', 'APPROVED')
    ORDER BY l.created_at DESC
  `);

  return rows.map(row => ({
    "Loan ID": row.loan_id,
    "Member": row.member_name,
    "Product": row.product_code,
    "Amount": Number(row.approved_amount || row.applied_amount),
    "Interest Rate": `${row.interest_rate}%`,
    "Term (Months)": row.term_months,
    "Status": row.workflow_status,
    "Disbursed Date": row.disbursement_date ? new Date(row.disbursement_date).toLocaleDateString() : '-',
    "Next Payment": row.next_payment_date ? new Date(row.next_payment_date).toLocaleDateString() : '-'
  }));
}

export async function getDelinquencyReport() {
  // Logic: Loans that are in DEFAULT status or past due date
  // For now, simpler check on status
  const rows = await query(`
    SELECT 
      l.loan_id,
      l.approved_amount,
      l.workflow_status,
      l.next_payment_date,
      CONCAT(m.first_name, ' ', m.last_name) as member_name,
      m.phone_primary
    FROM loan_applications l
    JOIN members m ON l.member_id = m.member_id
    WHERE l.workflow_status = 'DEFAULT' 
       OR (l.workflow_status = 'DISBURSED' AND l.next_payment_date < CURDATE())
    ORDER BY l.next_payment_date ASC
  `);

  return rows.map(row => ({
    "Loan ID": row.loan_id,
    "Member": row.member_name,
    "Phone": row.phone_primary,
    "Amount": Number(row.approved_amount),
    "Status": row.workflow_status,
    "Due Date": row.next_payment_date ? new Date(row.next_payment_date).toLocaleDateString() : 'Overdue',
    "Days Overdue": row.next_payment_date ? Math.floor((new Date().getTime() - new Date(row.next_payment_date).getTime()) / (1000 * 3600 * 24)) : 'N/A'
  }));
}

export async function getCashFlowReport(startDate, endDate) {
  const start = startDate || new Date(new Date().getFullYear(), 0, 1);
  const end = endDate || new Date();

  // Group by Day for detailed cash flow
  const rows = await query(
    `SELECT 
       DATE(created_at) as day,
       SUM(CASE WHEN txn_type = 'DEPOSIT' THEN amount ELSE 0 END) as total_inflow,
       SUM(CASE WHEN txn_type = 'WITHDRAWAL' THEN amount ELSE 0 END) as total_outflow
     FROM transactions
     WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at)
     ORDER BY day DESC`,
    [start, end]
  );
  
  return rows.map(r => ({
    "Date": new Date(r.day).toLocaleDateString(),
    "Total Inflow (Deposits)": Number(r.total_inflow),
    "Total Outflow (Withdrawals)": Number(r.total_outflow),
    "Net Cash Flow": Number(r.total_inflow) - Number(r.total_outflow)
  }));
}

export async function getMemberSummaryReport() {
  // List of all members with their key stats
  const rows = await query(`
    SELECT 
      m.membership_no,
      m.first_name,
      m.last_name,
      m.phone_primary,
      m.member_type,
      m.status,
      m.registered_date,
      (SELECT COUNT(*) FROM accounts a WHERE a.member_id = m.member_id) as account_count,
      (SELECT COALESCE(SUM(balance), 0) FROM accounts a WHERE a.member_id = m.member_id) as total_savings
    FROM members m
    ORDER BY m.registered_date DESC
  `);

  return rows.map(r => ({
    "Membership No": r.membership_no,
    "Name": `${r.first_name} ${r.last_name}`,
    "Type": r.member_type,
    "Status": r.status,
    "Phone": r.phone_primary,
    "Joined Date": new Date(r.registered_date).toLocaleDateString(),
    "Active Accounts": r.account_count,
    "Total Savings": Number(r.total_savings)
  }));
}

export async function getTellerDashboardStats(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's deposits
  const [todayDeposits] = await query(
    `SELECT 
      SUM(amount) as total,
      COUNT(*) as count
     FROM transactions 
     WHERE txn_type = 'DEPOSIT' 
     AND DATE(created_at) = CURDATE()
     AND performed_by = ?`,
    [userId]
  );

  // Today's withdrawals
  const [todayWithdrawals] = await query(
    `SELECT 
      SUM(amount) as total,
      COUNT(*) as count
     FROM transactions 
     WHERE txn_type = 'WITHDRAWAL' 
     AND DATE(created_at) = CURDATE()
     AND performed_by = ?`,
    [userId]
  );

  // Cash drawer (net: deposits - withdrawals for today)
  const netCash = Number(todayDeposits.total || 0) - Number(todayWithdrawals.total || 0);

  // Pending receipts (transactions without receipt photo uploaded today)
  const [pendingReceipts] = await query(
    `SELECT COUNT(*) as count
     FROM transactions 
     WHERE DATE(created_at) = CURDATE()
     AND performed_by = ?
     AND (receipt_photo_url IS NULL OR receipt_photo_url = '')`,
    [userId]
  );

  // Recent transactions (last 5 for this teller)
  const recentTransactions = await query(
    `SELECT 
      t.txn_id,
      t.txn_type,
      t.amount,
      t.reference,
      t.created_at,
      t.receipt_photo_url,
      a.product_code,
      m.first_name,
      m.last_name,
      m.membership_no
     FROM transactions t
     JOIN accounts a ON t.account_id = a.account_id
     JOIN members m ON a.member_id = m.member_id
     WHERE t.performed_by = ?
     ORDER BY t.created_at DESC
     LIMIT 5`,
    [userId]
  );

  return {
    today_deposits: {
      total: Number(todayDeposits.total || 0),
      count: Number(todayDeposits.count || 0)
    },
    today_withdrawals: {
      total: Number(todayWithdrawals.total || 0),
      count: Number(todayWithdrawals.count || 0)
    },
    cash_drawer: netCash,
    pending_receipts: Number(pendingReceipts.count || 0),
    recent_transactions: recentTransactions.map(t => ({
      txn_id: t.txn_id,
      txn_type: t.txn_type,
      amount: Number(t.amount),
      reference: t.reference,
      created_at: t.created_at,
      receipt_photo_url: t.receipt_photo_url,
      product_code: t.product_code,
      member_name: `${t.first_name} ${t.last_name}`,
      membership_no: t.membership_no
    }))
  };
}

export async function getCreditOfficerDashboardStats() {
  // Pending reviews (loans in UNDER_REVIEW or PENDING status)
  const [pendingReviews] = await query(
    `SELECT COUNT(*) as count 
     FROM loan_applications 
     WHERE workflow_status IN ('PENDING', 'UNDER_REVIEW')`
  );

  // This month applications processed (APPROVED, REJECTED, or DISBURSED this month)
  const [thisMonth] = await query(
    `SELECT COUNT(*) as count 
     FROM loan_applications 
     WHERE workflow_status IN ('APPROVED', 'REJECTED', 'DISBURSED')
     AND DATE(created_at) >= DATE_FORMAT(NOW(), '%Y-%m-01')`
  );

  // Portfolio value (sum of approved amounts for active loans)
  const [portfolioValue] = await query(
    `SELECT COALESCE(SUM(approved_amount), 0) as total
     FROM loan_applications 
     WHERE workflow_status IN ('APPROVED', 'DISBURSED')`
  );

  // Default rate (loans in DEFAULT status / total disbursed loans)
  const [defaultStats] = await query(
    `SELECT 
       SUM(CASE WHEN workflow_status = 'DEFAULT' THEN 1 ELSE 0 END) as default_count,
       COUNT(CASE WHEN workflow_status IN ('DISBURSED', 'DEFAULT') THEN 1 END) as total_disbursed
     FROM loan_applications`
  );

  const totalDisbursed = Number(defaultStats.total_disbursed || 0);
  const defaultCount = Number(defaultStats.default_count || 0);
  const defaultRate = totalDisbursed > 0 ? (defaultCount / totalDisbursed) * 100 : 0;

  return {
    pending_reviews: Number(pendingReviews.count || 0),
    this_month_processed: Number(thisMonth.count || 0),
    this_month: Number(thisMonth.count || 0), // Keep for backward compatibility
    portfolio_value: Number(portfolioValue.total || 0),
    default_rate: Number(defaultRate.toFixed(2))
  };
}

export async function getDailyOperationalReport(date) {
  const reportDate = date || new Date();
  const formattedDate = reportDate.toISOString().slice(0, 10);

  const [txnSummary] = await query(
    `SELECT 
       txn_type, 
       COUNT(*) as count, 
       SUM(amount) as total 
     FROM transactions 
     WHERE DATE(created_at) = ?
     GROUP BY txn_type`,
    [formattedDate]
  );

  const [newAccounts] = await query(
    'SELECT COUNT(*) as count FROM accounts WHERE DATE(created_at) = ?',
    [formattedDate]
  );

  const [newMembers] = await query(
    'SELECT COUNT(*) as count FROM members WHERE DATE(created_at) = ?',
    [formattedDate]
  );

  return {
    date: formattedDate,
    transactions: txnSummary,
    new_accounts: newAccounts.count,
    new_members: newMembers.count
  };
}

export async function getMonthlyStatement(memberId, month, year) {
  // Logic to fetch statement for a member
  // For now, return a placeholder or aggregated data if memberId is not provided
  return {
    member_id: memberId,
    period: `${year}-${month}`,
    transactions: [], // Populate with actual query
    opening_balance: 0,
    closing_balance: 0
  };
}

export async function getRegulatoryComplianceReport() {
  // Directive 982/2024 Metrics
  
  // 1. Capital Adequacy (Total Assets vs Total Liabilities/Equity)
  const [assets] = await query('SELECT SUM(balance) as total FROM accounts WHERE balance < 0'); // Simplistic view: Overdrafts as assets? No, usually Loans are assets.
  // Real Assets = Outstanding Loans + Cash (Not tracked in DB explicitly, derived from deposits)
  // Real Liabilities = Savings Deposits
  
  const [savings] = await query('SELECT SUM(balance) as total FROM accounts WHERE balance > 0');
  const [loans] = await query("SELECT SUM(approved_amount) as total FROM loan_applications WHERE workflow_status = 'DISBURSED'");
  
  const totalSavings = Number(savings.total || 0);
  const totalLoans = Number(loans.total || 0);
  
  // 2. Liquidity Ratio (Cash / Savings) - Assuming Cash = Savings - Loans (very rough approx for this system state)
  const cashOnHand = totalSavings - totalLoans; 
  const liquidityRatio = totalSavings > 0 ? (cashOnHand / totalSavings) * 100 : 0;

  // 3. Non-Performing Loans (NPL)
  const [npl] = await query(
    "SELECT SUM(approved_amount) as total FROM loan_applications WHERE workflow_status = 'DEFAULT'"
  );
  const totalNPL = Number(npl.total || 0);
  const nplRatio = totalLoans > 0 ? (totalNPL / totalLoans) * 100 : 0;

  return {
    generated_at: new Date(),
    metrics: {
      total_deposits: totalSavings,
      total_loans: totalLoans,
      liquidity_ratio: Number(liquidityRatio.toFixed(2)),
      npl_ratio: Number(nplRatio.toFixed(2)),
      capital_adequacy: "Pending Financial Statement Module" 
    }
  };
}
