import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { query, execute } from '../../core/db.js';
import { findLoanById } from '../loans/loan.repository.js';
import { deleteCollateral as deleteCollateralRepo } from './collateral.repository.js';

export async function verifyCollateral(collateralId, actor, payload) {
  const rows = await query('SELECT * FROM collateral WHERE collateral_id = ?', [collateralId]);
  const collateral = rows[0];
  if (!collateral) {
    throw httpError(404, 'Collateral not found');
  }
  
  await execute(
    `UPDATE collateral 
     SET verification_status = ?, 
         verified_by = ?, 
         verified_at = NOW(), 
         verification_notes = ?,
         verified_value = ?
     WHERE collateral_id = ?`,
    [
      payload.status || 'VERIFIED',
      actor.userId,
      payload.notes || null,
      payload.verified_value || collateral.estimated_value,
      collateralId
    ]
  );
  
  const updated = await query('SELECT * FROM collateral WHERE collateral_id = ?', [collateralId]);
  return updated[0];
}

export async function listCollateralForLoan(loanId) {
  return query('SELECT * FROM collateral WHERE loan_id = ?', [loanId]);
}

export async function getCollateralSummary(loanId) {
  const collaterals = await listCollateralForLoan(loanId);
  const totalEstimated = collaterals.reduce((sum, c) => sum + Number(c.estimated_value || 0), 0);
  const totalVerified = collaterals.reduce((sum, c) => sum + Number(c.verified_value || 0), 0);
  const allVerified = collaterals.every(c => c.verification_status === 'VERIFIED');
  
  return {
    collaterals,
    total_estimated: totalEstimated,
    total_verified: totalVerified,
    all_verified: allVerified,
    count: collaterals.length
  };
}

export async function deleteCollateral(collateralId) {
  await deleteCollateralRepo(collateralId);
  return { success: true };
}

