import { query, execute } from '../../core/db.js';

export async function listMemberDocuments(memberId, documentType = null) {
  let sql = 'SELECT * FROM member_documents WHERE member_id = ?';
  const params = [memberId];
  
  if (documentType) {
    sql += ' AND document_type = ?';
    params.push(documentType);
  }
  
  sql += ' ORDER BY created_at DESC';
  return query(sql, params);
}

export async function findMemberDocumentById(documentId) {
  const rows = await query('SELECT * FROM member_documents WHERE document_id = ?', [documentId]);
  return rows[0];
}

export async function createMemberDocument(payload) {
  await execute(
    `INSERT INTO member_documents
    (document_id, member_id, document_type, document_number, front_photo_url, back_photo_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      payload.document_id,
      payload.member_id,
      payload.document_type,
      payload.document_number || null,
      payload.front_photo_url || null,
      payload.back_photo_url || null
    ]
  );
}

export async function updateMemberDocument(documentId, updates) {
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  if (!fields.length) return;
  params.push(documentId);
  await execute(`UPDATE member_documents SET ${fields.join(', ')}, updated_at = NOW() WHERE document_id = ?`, params);
}

export async function deleteMemberDocument(documentId) {
  await execute('DELETE FROM member_documents WHERE document_id = ?', [documentId]);
}

export async function verifyMemberDocument(documentId, verifiedBy) {
  await execute(
    'UPDATE member_documents SET is_verified = 1, verified_by = ?, verified_at = NOW() WHERE document_id = ?',
    [verifiedBy, documentId]
  );
}

