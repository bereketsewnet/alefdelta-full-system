import { query } from '../../core/db.js';

export async function createMemberRegistrationRequest(requestId, memberData) {
  await query(
    `INSERT INTO member_registration_requests 
    (request_id, member_data, status)
    VALUES (?, ?, 'PENDING')`,
    [requestId, JSON.stringify(memberData)]
  );
}

export async function findMemberRegistrationRequestById(requestId) {
  const rows = await query(
    `SELECT 
      mrr.*,
      u.username as approver_username,
      u.role as approver_role
    FROM member_registration_requests mrr
    LEFT JOIN users u ON mrr.approved_by = u.user_id
    WHERE mrr.request_id = ?`,
    [requestId]
  );
  if (rows.length === 0) return null;
  
  const row = rows[0];
  // Parse JSON data
  let memberData = null;
  if (row.member_data) {
    if (typeof row.member_data === 'string') {
      try {
        memberData = JSON.parse(row.member_data);
      } catch (e) {
        console.error('Failed to parse member_data:', e);
      }
    } else {
      memberData = row.member_data; // Already an object
    }
  }
  
  return {
    ...row,
    member_data: memberData
  };
}

export async function listMemberRegistrationRequests(filters = {}) {
  const where = [];
  const params = [];
  
  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'PENDING') {
      // For pending, show both PENDING and TELLER_APPROVED (awaiting manager review)
      where.push('(mrr.status = ? OR mrr.status = ?)');
      params.push('PENDING', 'TELLER_APPROVED');
    } else {
      where.push('mrr.status = ?');
      params.push(filters.status);
    }
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const rows = await query(
    `SELECT 
      mrr.*,
      u.username as approver_username,
      u.role as approver_role
    FROM member_registration_requests mrr
    LEFT JOIN users u ON mrr.approved_by = u.user_id
    ${whereClause}
    ORDER BY mrr.created_at DESC`,
    params
  );
  
  // Parse JSON data for each row
  return rows.map(row => {
    let memberData = null;
    if (row.member_data) {
      if (typeof row.member_data === 'string') {
        try {
          memberData = JSON.parse(row.member_data);
        } catch (e) {
          console.error('Failed to parse member_data:', e);
        }
      } else {
        memberData = row.member_data;
      }
    }
    return {
      ...row,
      member_data: memberData
    };
  });
}

export async function updateMemberRegistrationRequestStatus(requestId, status, approverId, rejectionReason = null) {
  const updates = {
    status,
    approved_by: approverId,
    approved_at: new Date()
  };
  
  if (rejectionReason) {
    updates.rejection_reason = rejectionReason;
  }
  
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  
  params.push(requestId);
  await query(
    `UPDATE member_registration_requests 
    SET ${fields.join(', ')}, updated_at = NOW() 
    WHERE request_id = ?`,
    params
  );
}

