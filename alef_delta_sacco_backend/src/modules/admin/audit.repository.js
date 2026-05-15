import { execute } from '../../core/db.js';

export async function insertAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
  metadata = null
}) {
  await execute(
    `INSERT INTO audit_logs
    (user_id, action, entity, entity_id, old_value, new_value, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [userId, action, entity, entityId, JSON.stringify(oldValue), JSON.stringify(newValue), JSON.stringify(metadata)]
  );
}

