import { execute } from '../../core/db.js';

export async function insertAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
  metadata = null,
  connection = null
}) {
  const sql =
    `INSERT INTO audit_logs
    (user_id, action, entity, entity_id, old_value, new_value, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
  const params = [userId, action, entity, entityId, JSON.stringify(oldValue), JSON.stringify(newValue), JSON.stringify(metadata)];
  if (connection) {
    await connection.execute(sql, params);
    return;
  }
  await execute(sql, params);
}
