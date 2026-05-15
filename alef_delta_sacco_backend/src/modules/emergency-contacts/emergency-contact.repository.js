import { query, execute } from '../../core/db.js';

export async function listEmergencyContacts(memberId) {
  return query('SELECT * FROM emergency_contacts WHERE member_id = ? ORDER BY created_at DESC', [memberId]);
}

export async function findEmergencyContactById(contactId) {
  const rows = await query('SELECT * FROM emergency_contacts WHERE emergency_contact_id = ?', [contactId]);
  return rows[0];
}

export async function createEmergencyContact(payload) {
  await execute(
    `INSERT INTO emergency_contacts
    (emergency_contact_id, member_id, full_name, subcity, woreda, kebele, house_number, phone_number, relationship, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      payload.emergency_contact_id,
      payload.member_id,
      payload.full_name,
      payload.subcity || null,
      payload.woreda || null,
      payload.kebele || null,
      payload.house_number || null,
      payload.phone_number,
      payload.relationship || null
    ]
  );
}

export async function updateEmergencyContact(contactId, updates) {
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  if (!fields.length) return;
  params.push(contactId);
  await execute(`UPDATE emergency_contacts SET ${fields.join(', ')}, updated_at = NOW() WHERE emergency_contact_id = ?`, params);
}

export async function deleteEmergencyContact(contactId) {
  await execute('DELETE FROM emergency_contacts WHERE emergency_contact_id = ?', [contactId]);
}

