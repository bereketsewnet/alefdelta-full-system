import { query } from '../../core/db.js';

const db = (connection) => connection || { query: async (sql, params) => [await query(sql, params)] };

export async function snapshotBoardVoters(loanId, connection) {
  const executor = db(connection);
  const [members] = await executor.query("SELECT user_id FROM users WHERE role = 'BOARD_MEMBER' AND status = 'ACTIVE'", []);
  for (const member of members) {
    // eslint-disable-next-line no-await-in-loop
    await executor.query("INSERT INTO loan_approval_votes (vote_id, loan_id, voter_id, voter_role) VALUES (UUID(), ?, ?, 'BOARD_MEMBER')", [loanId, member.user_id]);
  }
}

export async function recordVote(loanId, actor, decision, reason, connection, override = {}) {
  const executor = db(connection);
  const [result] = await executor.query(
    `UPDATE loan_approval_votes SET decision = ?, reason = ?, eligibility_evaluation_id = ?,
     override_acknowledged = ?, override_reason = ?, decided_at = NOW()
     WHERE loan_id = ? AND voter_id = ?`,
    [decision, reason, override.evaluationId || null, override.acknowledged ? 1 : 0,
      override.reason || null, loanId, actor.userId]
  );
  if (!result.affectedRows) {
    await executor.query(
      `INSERT INTO loan_approval_votes
       (vote_id, loan_id, voter_id, voter_role, decision, reason, eligibility_evaluation_id,
        override_acknowledged, override_reason, decided_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [loanId, actor.userId, actor.role, decision, reason, override.evaluationId || null,
        override.acknowledged ? 1 : 0, override.reason || null]
    );
  }
}

export async function resetApprovalVotes(loanId, connection) {
  const executor = db(connection);
  await executor.query(
    `UPDATE loan_approval_votes SET decision = 'PENDING', reason = NULL, decided_at = NULL,
     eligibility_evaluation_id = NULL, override_acknowledged = 0, override_reason = NULL
     WHERE loan_id = ?`,
    [loanId]
  );
}

export async function getApprovalStatus(loanId, connection) {
  const executor = db(connection);
  const [rows] = await executor.query(`SELECT v.voter_id, v.voter_role, v.decision, v.reason, v.decided_at,
    v.eligibility_evaluation_id, v.override_acknowledged, v.override_reason, u.username
    FROM loan_approval_votes v JOIN users u ON u.user_id = v.voter_id WHERE v.loan_id = ? ORDER BY v.voter_role, u.username`, [loanId]);
  const board = rows.filter((row) => row.voter_role === 'BOARD_MEMBER');
  const manager = rows.filter((row) => row.voter_role === 'MANAGER' || row.voter_role === 'ADMIN');
  return {
    votes: rows.map((row) => ({ ...row, override_acknowledged: Boolean(row.override_acknowledged) })),
    board_required: board.length,
    board_approved: board.filter((row) => row.decision === 'APPROVED').length,
    manager_approved: manager.some((row) => row.decision === 'APPROVED'),
    rejected: rows.find((row) => row.decision === 'REJECTED') || null
  };
}
