import { query, execute } from '../../core/db.js';

export async function findMemberByPhone(phone) {
  const rows = await query('SELECT * FROM members WHERE phone_primary = ?', [phone]);
  return rows[0];
}

export async function findMemberById(memberId) {
  const rows = await query('SELECT * FROM members WHERE member_id = ?', [memberId]);
  return rows[0];
}

export async function listMembers({ search, status, limit = 25, offset = 0 }) {
  const where = [];
  const params = [];
  
  if (search) {
    const searchTerm = `%${search}%`;
    const searchConditions = [];
    const trimmedSearch = search.trim();
    
    // Search in names (first, middle, last)
    searchConditions.push('(first_name LIKE ? OR middle_name LIKE ? OR last_name LIKE ?)');
    params.push(searchTerm, searchTerm, searchTerm);
    
    // Handle membership number search with or without MEM- prefix
    // Can search: MEM-17236872374, Mem-17236872374, or just 17236872374
    const memNoMatch = trimmedSearch.match(/^(?:mem-|MEM-)?(\d+)$/i);
    if (memNoMatch) {
      const memNumber = memNoMatch[1];
      // Search for both formats: MEM-{number} and just {number}
      searchConditions.push('(membership_no LIKE ? OR membership_no LIKE ? OR membership_no = ? OR membership_no = ?)');
      params.push(`%MEM-${memNumber}%`, `%Mem-${memNumber}%`, `MEM-${memNumber}`, memNumber);
    } else {
      // Fallback: search membership_no with LIKE for partial matches
      searchConditions.push('membership_no LIKE ?');
      params.push(searchTerm);
    }
    
    // Handle phone number search with different formats
    // Phone can be: +251965500539, 965500539, 0965500539, or 65500539
    // If search looks like a phone number (contains digits), also search in phone_primary
    if (/[\d+]/.test(trimmedSearch)) {
      // Remove common prefixes and search for the core number
      let phonePattern = trimmedSearch.replace(/^\+251/, '').replace(/^0/, '').replace(/^251/, '');
      
      // If we have a phone pattern, search for it in different formats
      if (phonePattern && /^\d+$/.test(phonePattern)) {
        // Search for: +251{pattern}, 0{pattern}, {pattern}, or exact match
        searchConditions.push('(phone_primary LIKE ? OR phone_primary LIKE ? OR phone_primary LIKE ? OR phone_primary = ?)');
        params.push(`%+251${phonePattern}%`, `%0${phonePattern}%`, `%${phonePattern}%`, phonePattern);
      } else {
        // Fallback: just search with LIKE
        searchConditions.push('phone_primary LIKE ?');
        params.push(searchTerm);
      }
    }
    
    // Combine all search conditions with OR
    where.push(`(${searchConditions.join(' OR ')})`);
  }
  
  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT * FROM members ${whereClause} ORDER BY registered_date DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

export async function createMember(member) {
  await execute(
    `INSERT INTO members
    (member_id, membership_no, first_name, middle_name, last_name, phone_primary, email, gender,
     marital_status, age, family_size_female, family_size_male, educational_level, occupation,
     work_experience_years, address_subcity, address_woreda, address_kebele, address_area_name,
     address_house_no, national_id_number, shares_requested, terms_accepted, terms_accepted_at,
     member_type, monthly_income, tin_number, status, profile_photo_url, id_card_url, id_card_front_url, id_card_back_url, password_hash, registered_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      member.member_id,
      member.membership_no,
      member.first_name,
      member.middle_name,
      member.last_name,
      member.phone_primary,
      member.email,
      member.gender,
      member.marital_status,
      member.age || null,
      member.family_size_female || 0,
      member.family_size_male || 0,
      member.educational_level || null,
      member.occupation || null,
      member.work_experience_years || null,
      member.address_subcity,
      member.address_woreda,
      member.address_kebele || null,
      member.address_area_name || null,
      member.address_house_no,
      member.national_id_number || null,
      member.shares_requested || 0,
      member.terms_accepted ? 1 : 0,
      member.terms_accepted_at || null,
      member.member_type,
      member.monthly_income,
      member.tin_number,
      member.status,
      member.profile_photo_url,
      member.id_card_url,
      member.id_card_front_url || null,
      member.id_card_back_url || null,
      member.password_hash
    ]
  );
}

export async function updateMember(memberId, updates) {
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  if (!fields.length) return;
  params.push(memberId);
  await execute(`UPDATE members SET ${fields.join(', ')}, updated_at = NOW() WHERE member_id = ?`, params);
}

export async function updateMemberPassword(memberId, passwordHash) {
  await execute(
    'UPDATE members SET password_hash = ?, password_changed_at = NOW() WHERE member_id = ?',
    [passwordHash, memberId]
  );
}

export async function resetMemberPassword(memberId, passwordHash) {
  await execute(
    'UPDATE members SET password_hash = ?, password_changed_at = NOW() WHERE member_id = ?',
    [passwordHash, memberId]
  );
}

export async function deleteMember(memberId) {
  await execute('DELETE FROM members WHERE member_id = ?', [memberId]);
}

export async function countMembers(filters) {
  const where = [];
  const params = [];
  
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    const searchConditions = [];
    const trimmedSearch = filters.search.trim();
    
    // Search in names (first, middle, last)
    searchConditions.push('(first_name LIKE ? OR middle_name LIKE ? OR last_name LIKE ?)');
    params.push(searchTerm, searchTerm, searchTerm);
    
    // Handle membership number search with or without MEM- prefix
    // Can search: MEM-17236872374, Mem-17236872374, or just 17236872374
    const memNoMatch = trimmedSearch.match(/^(?:mem-|MEM-)?(\d+)$/i);
    if (memNoMatch) {
      const memNumber = memNoMatch[1];
      // Search for both formats: MEM-{number} and just {number}
      searchConditions.push('(membership_no LIKE ? OR membership_no LIKE ? OR membership_no = ? OR membership_no = ?)');
      params.push(`%MEM-${memNumber}%`, `%Mem-${memNumber}%`, `MEM-${memNumber}`, memNumber);
    } else {
      // Fallback: search membership_no with LIKE for partial matches
      searchConditions.push('membership_no LIKE ?');
      params.push(searchTerm);
    }
    
    // Handle phone number search with different formats
    const phoneSearch = trimmedSearch;
    if (/[\d+]/.test(phoneSearch)) {
      // Remove common prefixes and search for the core number
      let phonePattern = phoneSearch.replace(/^\+251/, '').replace(/^0/, '').replace(/^251/, '');
      
      // If we have a phone pattern, search for it in different formats
      if (phonePattern && /^\d+$/.test(phonePattern)) {
        // Search for: +251{pattern}, 0{pattern}, {pattern}, or exact match
        searchConditions.push('(phone_primary LIKE ? OR phone_primary LIKE ? OR phone_primary LIKE ? OR phone_primary = ?)');
        params.push(`%+251${phonePattern}%`, `%0${phonePattern}%`, `%${phonePattern}%`, phonePattern);
      } else {
        // Fallback: just search with LIKE
        searchConditions.push('phone_primary LIKE ?');
        params.push(searchTerm);
      }
    }
    
    // Combine all search conditions with OR
    where.push(`(${searchConditions.join(' OR ')})`);
  }
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(`SELECT COUNT(*) as total FROM members ${whereClause}`, params);
  return rows[0].total;
}

