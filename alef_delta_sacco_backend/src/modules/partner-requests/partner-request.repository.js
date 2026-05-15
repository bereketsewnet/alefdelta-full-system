import { query } from '../../core/db.js';

export async function createPartnerRequest(requestId, partnerData) {
  await query(
    `INSERT INTO partner_requests 
    (request_id, name, company_name, phone, request_type, sponsorship_type, status)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      requestId,
      partnerData.name,
      partnerData.company_name || null,
      partnerData.phone,
      partnerData.request_type,
      partnerData.sponsorship_type || null
    ]
  );
}

export async function findPartnerRequestById(requestId) {
  const rows = await query(
    `SELECT 
      pr.*,
      u.username as approver_username,
      u.role as approver_role
    FROM partner_requests pr
    LEFT JOIN users u ON pr.approved_by = u.user_id
    WHERE pr.request_id = ?`,
    [requestId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function listPartnerRequests(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.status && filters.status !== 'ALL') {
    where.push('pr.status = ?');
    params.push(filters.status);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const rows = await query(
    `SELECT 
      pr.*,
      u.username as approver_username,
      u.role as approver_role
    FROM partner_requests pr
    LEFT JOIN users u ON pr.approved_by = u.user_id
    ${whereClause}
    ORDER BY pr.created_at DESC`,
    params
  );
  
  return rows;
}

export async function updatePartnerRequestStatus(requestId, status, approverId, rejectionReason = null) {
  const updates = ['status = ?', 'approved_by = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const params = [status, approverId];
  
  if (status === 'APPROVED') {
    updates.push('approved_at = CURRENT_TIMESTAMP');
  }
  
  if (status === 'REJECTED' && rejectionReason) {
    updates.push('rejection_reason = ?');
    params.push(rejectionReason);
  }
  
  params.push(requestId);
  
  await query(
    `UPDATE partner_requests 
    SET ${updates.join(', ')}
    WHERE request_id = ?`,
    params
  );
}



