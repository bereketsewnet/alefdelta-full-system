import { query, execute } from '../../core/db.js';

export async function listGuarantorsByLoan(loanId) {
  return query('SELECT * FROM guarantors WHERE loan_id = ?', [loanId]);
}

export async function addGuarantor(payload) {
  await execute(
    `INSERT INTO guarantors
    (guarantor_id, loan_id, full_name, phone, relationship, address, age, guaranteed_amount, id_front_url, id_back_url, profile_photo_url, duty_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.guarantor_id,
      payload.loan_id,
      payload.full_name,
      payload.phone,
      payload.relationship || null,
      payload.address || null,
      payload.age || null,
      payload.guaranteed_amount,
      payload.id_front_url || null,
      payload.id_back_url || null,
      payload.profile_photo_url || null,
      payload.duty_value || null
    ]
  );
}

export async function updateGuarantor(guarantorId, updates) {
  const fields = [];
  const values = [];
  
  if (updates.full_name !== undefined) {
    fields.push('full_name = ?');
    values.push(updates.full_name);
  }
  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone);
  }
  if (updates.relationship !== undefined) {
    fields.push('relationship = ?');
    values.push(updates.relationship);
  }
  if (updates.address !== undefined) {
    fields.push('address = ?');
    values.push(updates.address);
  }
  if (updates.age !== undefined) {
    fields.push('age = ?');
    values.push(updates.age);
  }
  if (updates.guaranteed_amount !== undefined) {
    fields.push('guaranteed_amount = ?');
    values.push(updates.guaranteed_amount);
  }
  if (updates.id_front_url !== undefined) {
    fields.push('id_front_url = ?');
    values.push(updates.id_front_url);
  }
  if (updates.id_back_url !== undefined) {
    fields.push('id_back_url = ?');
    values.push(updates.id_back_url);
  }
  if (updates.profile_photo_url !== undefined) {
    fields.push('profile_photo_url = ?');
    values.push(updates.profile_photo_url);
  }
  if (updates.duty_value !== undefined) {
    fields.push('duty_value = ?');
    values.push(updates.duty_value);
  }
  
  if (fields.length === 0) {
    return;
  }
  
  values.push(guarantorId);
  await execute(
    `UPDATE guarantors SET ${fields.join(', ')} WHERE guarantor_id = ?`,
    values
  );
}

export async function deleteGuarantor(guarantorId) {
  await execute('DELETE FROM guarantors WHERE guarantor_id = ?', [guarantorId]);
}

