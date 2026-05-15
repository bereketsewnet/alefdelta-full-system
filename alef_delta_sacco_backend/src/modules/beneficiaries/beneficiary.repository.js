import { query, execute } from '../../core/db.js';

export async function listBeneficiaries(memberId) {
  return query('SELECT * FROM beneficiaries WHERE member_id = ?', [memberId]);
}

export async function findBeneficiaryById(beneficiaryId) {
  const rows = await query('SELECT * FROM beneficiaries WHERE beneficiary_id = ?', [beneficiaryId]);
  return rows[0];
}

export async function createBeneficiary(payload) {
  await execute(
    `INSERT INTO beneficiaries
    (beneficiary_id, member_id, full_name, relationship, phone, profile_photo_url, id_front_url, id_back_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      payload.beneficiary_id,
      payload.member_id,
      payload.full_name,
      payload.relationship,
      payload.phone,
      payload.profile_photo_url || null,
      payload.id_front_url || null,
      payload.id_back_url || null
    ]
  );
}

export async function updateBeneficiary(beneficiaryId, updates) {
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  if (!fields.length) return;
  params.push(beneficiaryId);
  await execute(`UPDATE beneficiaries SET ${fields.join(', ')}, updated_at = NOW() WHERE beneficiary_id = ?`, params);
}

export async function deleteBeneficiary(beneficiaryId) {
  await execute('DELETE FROM beneficiaries WHERE beneficiary_id = ?', [beneficiaryId]);
}

