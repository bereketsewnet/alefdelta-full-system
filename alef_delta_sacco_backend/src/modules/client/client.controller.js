import {
  getClientProfile,
  getClientAccounts,
  getClientAccountTransactions,
  getClientTransactions,
  getClientLoans,
  getClientLoanSchedule
} from './client.service.js';

export async function handleGetProfile(req, res, next) {
  try {
    const profile = await getClientProfile(req.user.memberId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function handleGetAccounts(req, res, next) {
  try {
    const accounts = await getClientAccounts(req.user.memberId);
    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
}

export async function handleGetAccountTransactions(req, res, next) {
  try {
    const transactions = await getClientAccountTransactions(
      req.user.memberId,
      req.params.accountId,
      { limit: req.query.limit, offset: req.query.offset }
    );
    res.json({ data: transactions });
  } catch (error) {
    next(error);
  }
}

export async function handleGetTransactions(req, res, next) {
  try {
    const transactions = await getClientTransactions(
      req.user.memberId,
      { limit: req.query.limit, offset: req.query.offset }
    );
    res.json({ data: transactions });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLoans(req, res, next) {
  try {
    const loans = await getClientLoans(req.user.memberId);
    res.json({ data: loans });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLoanSchedule(req, res, next) {
  try {
    const schedule = await getClientLoanSchedule(req.user.memberId, req.params.loanId);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
}

