import httpError from '../../core/utils/httpError.js';
import { query, execute } from '../../core/db.js';
import { deleteGuarantor as deleteGuarantorRepo } from './guarantor.repository.js';

export async function verifyGuarantor(guarantorId, actor, payload) {
  const rows = await query('SELECT * FROM guarantors WHERE guarantor_id = ?', [guarantorId]);
  const guarantor = rows[0];
  if (!guarantor) {
    throw httpError(404, 'Guarantor not found');
  }
  
  // For standalone guarantors, verification is based on document verification
  // and manual review rather than member account checks
  const verificationStatus = payload.status === 'REJECTED' ? 'REJECTED' : 'VERIFIED';
  
  await execute(
    `UPDATE guarantors 
     SET verification_status = ?, 
         verified_by = ?, 
         verified_at = NOW(), 
         verification_notes = ?
     WHERE guarantor_id = ?`,
    [
      verificationStatus,
      actor.userId,
      payload.notes || (verificationStatus === 'VERIFIED' ? 'Guarantor verified' : 'Guarantor rejected'),
      guarantorId
    ]
  );
  
  const updated = await query('SELECT * FROM guarantors WHERE guarantor_id = ?', [guarantorId]);
  return updated[0];
}

export async function listGuarantorsForLoan(loanId) {
  const guarantors = await query('SELECT * FROM guarantors WHERE loan_id = ?', [loanId]);
  return guarantors;
}

export async function getGuarantorSummary(loanId) {
  const guarantors = await listGuarantorsForLoan(loanId);
  const totalGuaranteed = guarantors.reduce((sum, g) => sum + Number(g.guaranteed_amount || 0), 0);
  const allVerified = guarantors.every(g => g.verification_status === 'VERIFIED');
  
  return {
    guarantors,
    total_guaranteed: totalGuaranteed,
    all_verified: allVerified,
    count: guarantors.length
  };
}

export async function deleteGuarantor(guarantorId) {
  await deleteGuarantorRepo(guarantorId);
  return { success: true };
}

