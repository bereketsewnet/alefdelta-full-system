import { verifyCollateral, getCollateralSummary, listCollateralForLoan, deleteCollateral } from './collateral.service.js';

export async function handleVerifyCollateral(req, res, next) {
  try {
    const collateral = await verifyCollateral(req.params.id, req.user, req.body);
    res.json(collateral);
  } catch (error) {
    next(error);
  }
}

export async function handleGetCollateralSummary(req, res, next) {
  try {
    const summary = await getCollateralSummary(req.params.loanId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function handleListCollateralForLoan(req, res, next) {
  try {
    const collateral = await listCollateralForLoan(req.params.loanId);
    res.json({ data: collateral });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteCollateral(req, res, next) {
  try {
    await deleteCollateral(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

