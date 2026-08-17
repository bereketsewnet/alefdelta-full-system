import { v4 as uuid } from 'uuid';
import { query } from '../../core/db.js';

function executor(connection) {
  return connection
    ? { query: async (sql, params = []) => (await connection.query(sql, params))[0] }
    : { query };
}

function parseSnapshot(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

export async function createEligibilityEvaluation({ loanId, source, result, actorUserId }, connection) {
  const db = executor(connection);
  const evaluationId = uuid();
  await db.query(
    `INSERT INTO loan_eligibility_evaluations
     (evaluation_id, loan_id, evaluation_source, passed, result_snapshot, evaluated_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [evaluationId, loanId, source, result.passed ? 1 : 0, JSON.stringify(result), actorUserId || null]
  );
  return evaluationId;
}

export async function findEligibilityEvaluation(evaluationId, connection) {
  if (!evaluationId) return null;
  const db = executor(connection);
  const rows = await db.query('SELECT * FROM loan_eligibility_evaluations WHERE evaluation_id = ?', [evaluationId]);
  if (!rows[0]) return null;
  return { ...rows[0], passed: Boolean(rows[0].passed), result_snapshot: parseSnapshot(rows[0].result_snapshot) };
}

export async function listLoanEligibilityEvaluations(loanId) {
  const rows = await query(
    `SELECT e.*, u.username AS evaluated_by_username
     FROM loan_eligibility_evaluations e
     LEFT JOIN users u ON u.user_id = e.evaluated_by_user_id
     WHERE e.loan_id = ? ORDER BY e.created_at DESC`,
    [loanId]
  );
  return rows.map((row) => ({ ...row, passed: Boolean(row.passed), result_snapshot: parseSnapshot(row.result_snapshot) }));
}
