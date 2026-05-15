/**
 * Member Lifecycle Automation
 * Automatically manages member status based on inactivity periods
 */

import dayjs from 'dayjs';
import { query, execute, withTransaction } from '../../core/db.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import logger from '../../core/logger.js';

/**
 * Get system configuration value
 */
async function getSystemConfig(key, defaultValue) {
  const rows = await query('SELECT config_value FROM system_config WHERE config_key = ?', [key]);
  if (rows && rows.length > 0) {
    return rows[0].config_value;
  }
  return defaultValue;
}

/**
 * Update member's last activity date
 * Call this after any transaction, loan payment, or login
 */
export async function updateMemberActivity(memberId) {
  try {
    await execute(`
      UPDATE members 
      SET 
        last_activity_date = ?,
        inactivity_days = 0
      WHERE member_id = ?
    `, [dayjs().format('YYYY-MM-DD'), memberId]);
  } catch (error) {
    logger.error('Failed to update member activity', { member_id: memberId, error: error.message });
  }
}

/**
 * Process member status updates based on inactivity
 * Runs daily to check all members
 */
export async function processInactiveMemberStatuses() {
  console.log('👥 Processing Member Inactivity Status Updates...\n');
  
  // Get configuration
  const enabled = await getSystemConfig('inactivity_check_enabled', 'true');
  if (enabled !== 'true') {
    console.log('⏸️  Inactivity checking is disabled in system config\n');
    return { enabled: false, processed: 0 };
  }
  
  const inactiveDays = Number(await getSystemConfig('member_inactive_days', '90'));
  const terminatedDays = Number(await getSystemConfig('member_terminated_days', '365'));
  
  console.log(`📋 Configuration:`);
  console.log(`   Inactive after: ${inactiveDays} days (${Math.floor(inactiveDays/30)} months)`);
  console.log(`   Terminated after: ${terminatedDays} days (${Math.floor(terminatedDays/30)} months)\n`);
  
  const today = dayjs();
  
  // Get all active and inactive members
  const members = await query(`
    SELECT * FROM members 
    WHERE status IN ('ACTIVE', 'INACTIVE')
    AND last_activity_date IS NOT NULL
  `);
  
  console.log(`Found ${members.length} member(s) to check\n`);
  
  let toInactiveCount = 0;
  let toTerminatedCount = 0;
  let unchangedCount = 0;
  
  for (const member of members) {
    try {
      const lastActivity = dayjs(member.last_activity_date);
      const daysSinceActivity = today.diff(lastActivity, 'day');
      
      // Determine new status
      let newStatus = member.status;
      let statusChanged = false;
      
      if (daysSinceActivity >= terminatedDays && member.status !== 'TERMINATED') {
        // Member should be terminated
        newStatus = 'TERMINATED';
        statusChanged = true;
        toTerminatedCount++;
        
      } else if (daysSinceActivity >= inactiveDays && member.status === 'ACTIVE') {
        // Member should be inactive
        newStatus = 'INACTIVE';
        statusChanged = true;
        toInactiveCount++;
        
      } else {
        unchangedCount++;
      }
      
      if (statusChanged) {
        await withTransaction(async (connection) => {
          // Update member status
          await connection.execute(`
            UPDATE members 
            SET 
              status = ?,
              inactivity_days = ?,
              auto_status_changed_at = NOW()
            WHERE member_id = ?
          `, [newStatus, daysSinceActivity, member.member_id]);
          
          // Audit log
          await insertAuditLog({
            userId: null, // System action
            action: 'AUTO_STATUS_CHANGE',
            entity: 'members',
            entityId: member.member_id,
            metadata: {
              old_status: member.status,
              new_status: newStatus,
              days_inactive: daysSinceActivity,
              last_activity: member.last_activity_date,
              reason: 'INACTIVITY'
            }
          });
        });
        
        console.log(`✅ Member ${member.membership_no} (${member.first_name} ${member.last_name}): ${member.status} → ${newStatus} (${daysSinceActivity} days inactive)`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing member ${member.member_id}:`, error.message);
      logger.error('Member status processing error', { member_id: member.member_id, error: error.message });
    }
  }
  
  console.log(`\n📊 Member Status Update Summary:`);
  console.log(`   Total Checked: ${members.length}`);
  console.log(`   Changed to INACTIVE: ${toInactiveCount}`);
  console.log(`   Changed to TERMINATED: ${toTerminatedCount}`);
  console.log(`   Unchanged: ${unchangedCount}`);
  
  return {
    total_checked: members.length,
    to_inactive: toInactiveCount,
    to_terminated: toTerminatedCount,
    unchanged: unchangedCount
  };
}

/**
 * Reactivate an inactive or terminated member
 * Requires manager approval
 */
export async function reactivateMember(memberId, notes, actor) {
  const members = await query('SELECT * FROM members WHERE member_id = ?', [memberId]);
  const member = members[0];
  
  if (!member) {
    throw new Error('Member not found');
  }
  
  if (member.status !== 'INACTIVE' && member.status !== 'TERMINATED') {
    throw new Error(`Cannot reactivate member with status: ${member.status}`);
  }
  
  await withTransaction(async (connection) => {
    await connection.execute(`
      UPDATE members 
      SET 
        status = 'ACTIVE',
        last_activity_date = ?,
        inactivity_days = 0,
        auto_status_changed_at = NULL,
        reactivation_notes = ?,
        updated_at = NOW()
      WHERE member_id = ?
    `, [dayjs().format('YYYY-MM-DD'), notes, memberId]);
    
    // Audit log
    await insertAuditLog({
      userId: actor.userId,
      action: 'REACTIVATE_MEMBER',
      entity: 'members',
      entityId: memberId,
      metadata: {
        old_status: member.status,
        new_status: 'ACTIVE',
        reactivated_by: actor.username,
        notes: notes
      }
    });
  });
  
  return {
    success: true,
    member_id: memberId,
    old_status: member.status,
    new_status: 'ACTIVE',
    message: `Member ${member.membership_no} reactivated successfully`
  };
}

/**
 * Get inactive members report
 */
export async function getInactiveMembersReport() {
  const inactiveDays = Number(await getSystemConfig('member_inactive_days', '90'));
  const today = dayjs().format('YYYY-MM-DD');
  
  return query(`
    SELECT 
      m.*,
      DATEDIFF(?, m.last_activity_date) as days_inactive,
      CASE 
        WHEN DATEDIFF(?, m.last_activity_date) >= ? THEN 'DUE_FOR_TERMINATION'
        WHEN DATEDIFF(?, m.last_activity_date) >= ? THEN 'DUE_FOR_INACTIVE'
        ELSE 'AT_RISK'
      END as inactivity_status
    FROM members m
    WHERE m.status IN ('ACTIVE', 'INACTIVE')
    AND m.last_activity_date IS NOT NULL
    AND DATEDIFF(?, m.last_activity_date) >= ?
    ORDER BY m.last_activity_date ASC
  `, [
    today, 
    today, terminatedDays,
    today, inactiveDays,
    today, Math.floor(inactiveDays * 0.8) // 80% of inactive period
  ]);
  
  const terminatedDays = Number(await getSystemConfig('member_terminated_days', '365'));
  
  return query(`
    SELECT 
      m.*,
      DATEDIFF(?, m.last_activity_date) as days_inactive,
      CASE 
        WHEN DATEDIFF(?, m.last_activity_date) >= ${terminatedDays} THEN 'DUE_FOR_TERMINATION'
        WHEN DATEDIFF(?, m.last_activity_date) >= ${inactiveDays} THEN 'DUE_FOR_INACTIVE'
        ELSE 'AT_RISK'
      END as inactivity_status
    FROM members m
    WHERE m.status IN ('ACTIVE', 'INACTIVE')
    AND m.last_activity_date IS NOT NULL
    AND DATEDIFF(?, m.last_activity_date) >= ${Math.floor(inactiveDays * 0.8)}
    ORDER BY m.last_activity_date ASC
  `, [today, today, today, today]);
}


