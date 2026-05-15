import { 
  getOperationalSummary, 
  getTransactionReport, 
  getTellerDashboardStats, 
  getCreditOfficerDashboardStats,
  getDailyOperationalReport,
  getMonthlyStatement,
  getRegulatoryComplianceReport,
  getLoanPortfolioReport,
  getDelinquencyReport,
  getCashFlowReport,
  getMemberSummaryReport
} from './report.service.js';

export async function handleSummary(req, res, next) {
  try {
    const summary = await getOperationalSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function handleTransactionReport(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const stats = await getTransactionReport(start_date, end_date);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function handleLoanPortfolioReport(req, res, next) {
  try {
    const report = await getLoanPortfolioReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function handleDelinquencyReport(req, res, next) {
  try {
    const report = await getDelinquencyReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function handleCashFlowReport(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const report = await getCashFlowReport(start_date, end_date);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function handleMemberSummaryReport(req, res, next) {
  try {
    const report = await getMemberSummaryReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function handleTellerDashboard(req, res, next) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User ID required' });
    }
    const stats = await getTellerDashboardStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function handleCreditOfficerDashboard(req, res, next) {
  try {
    const stats = await getCreditOfficerDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function handleDailyOperationalReport(req, res, next) {
  try {
    const { date } = req.query;
    const report = await getDailyOperationalReport(date);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function handleMonthlyStatement(req, res, next) {
  try {
    const { member_id, month, year } = req.query;
    const report = await getMonthlyStatement(member_id, month, year);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function handleRegulatoryReport(req, res, next) {
  try {
    const report = await getRegulatoryComplianceReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
}
