import { execute, query } from '../../core/db.js';
import httpError from '../../core/utils/httpError.js';

export function normalizeFinancialReference(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function cleanFinancialReference(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function duplicateReferenceError(reference, existing = null) {
  const error = httpError(
    409,
    `Reference / Receipt No. "${cleanFinancialReference(reference)}" is already registered. Enter a unique reference number.`,
    existing ? {
      existing_type: existing.reference_kind,
      existing_status: existing.status,
      registered_at: existing.created_at
    } : undefined
  );
  error.code = 'DUPLICATE_FINANCIAL_REFERENCE';
  return error;
}

async function selectReference(referenceKey, connection = null) {
  const sql = 'SELECT reference_key, reference_value, reference_kind, source_id, status, created_at FROM financial_reference_registry WHERE reference_key = ? LIMIT 1';
  if (connection) {
    const [rows] = await connection.query(sql, [referenceKey]);
    return rows[0] || null;
  }
  const rows = await query(sql, [referenceKey]);
  return rows[0] || null;
}

export async function getFinancialReferenceAvailability(reference) {
  const referenceKey = normalizeFinancialReference(reference);
  if (!referenceKey) throw httpError(400, 'Reference / Receipt No. is required');
  if (referenceKey.length > 160) throw httpError(400, 'Reference / Receipt No. must not exceed 160 characters');
  const existing = await selectReference(referenceKey);
  return {
    reference: cleanFinancialReference(reference),
    available: !existing,
    message: existing
      ? 'This Reference / Receipt No. is already registered.'
      : 'Reference / Receipt No. is available.'
  };
}

export async function claimFinancialReference({
  reference,
  referenceKind,
  sourceId,
  memberId = null,
  status = 'POSTED',
  connection = null
}) {
  const referenceValue = cleanFinancialReference(reference);
  const referenceKey = normalizeFinancialReference(referenceValue);
  if (!referenceKey) throw httpError(400, 'Reference / Receipt No. is required');
  if (referenceValue.length > 160) throw httpError(400, 'Reference / Receipt No. must not exceed 160 characters');

  const sql = `INSERT INTO financial_reference_registry
    (reference_key, reference_value, reference_kind, source_id, member_id, status, posted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    referenceKey,
    referenceValue,
    referenceKind,
    sourceId,
    memberId,
    status,
    status === 'POSTED' ? new Date() : null
  ];

  try {
    if (connection) await connection.execute(sql, params);
    else await execute(sql, params);
  } catch (error) {
    if (error?.original?.code === 'ER_DUP_ENTRY' || error?.parent?.code === 'ER_DUP_ENTRY' || error?.code === 'ER_DUP_ENTRY') {
      const existing = await selectReference(referenceKey, connection);
      if (existing?.reference_kind === referenceKind && existing?.source_id === sourceId) return existing;
      throw duplicateReferenceError(referenceValue, existing);
    }
    throw error;
  }

  return selectReference(referenceKey, connection);
}

export async function assertFinancialReferenceOwner({ reference, referenceKind, sourceId, connection }) {
  const referenceKey = normalizeFinancialReference(reference);
  if (!referenceKey) throw httpError(400, 'Reference / Receipt No. is required');
  const existing = await selectReference(referenceKey, connection);
  if (!existing) throw httpError(409, 'The reserved Reference / Receipt No. could not be found. Please resubmit the request.');
  if (existing.reference_kind !== referenceKind || existing.source_id !== sourceId) {
    throw duplicateReferenceError(reference, existing);
  }
  return existing;
}

export async function markFinancialReferencePosted(reference, referenceKind, sourceId, connection) {
  const referenceKey = normalizeFinancialReference(reference);
  const sql = `UPDATE financial_reference_registry
    SET status = 'POSTED', posted_at = COALESCE(posted_at, NOW())
    WHERE reference_key = ? AND reference_kind = ? AND source_id = ?`;
  const params = [referenceKey, referenceKind, sourceId];
  if (connection) await connection.execute(sql, params);
  else await execute(sql, params);
}

export async function markFinancialReferenceRetired(reference, referenceKind, sourceId, connection = null) {
  const referenceKey = normalizeFinancialReference(reference);
  if (!referenceKey) return;
  const sql = `UPDATE financial_reference_registry
    SET status = 'RETIRED'
    WHERE reference_key = ? AND reference_kind = ? AND source_id = ? AND status = 'RESERVED'`;
  const params = [referenceKey, referenceKind, sourceId];
  if (connection) await connection.execute(sql, params);
  else await execute(sql, params);
}
