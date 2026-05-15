import { query } from '../../core/db.js';
import { v4 as uuid } from 'uuid';

/**
 * Create a new notification
 */
export async function createNotification(notification) {
  const notificationId = notification.notification_id || uuid();
  await query(
    `INSERT INTO notifications 
    (notification_id, member_id, type, title, message, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      notificationId,
      notification.member_id,
      notification.type,
      notification.title,
      notification.message,
      notification.metadata ? JSON.stringify(notification.metadata) : null
    ]
  );
  return notificationId;
}

/**
 * Get notifications for a member
 */
export async function getMemberNotifications(memberId, filters = {}) {
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const isRead = filters.is_read;
  
  let sql = `
    SELECT 
      notification_id,
      member_id,
      type,
      title,
      message,
      metadata,
      is_read,
      read_at,
      created_at,
      updated_at
    FROM notifications
    WHERE member_id = ?
  `;
  
  const params = [memberId];
  
  if (isRead !== undefined) {
    sql += ' AND is_read = ?';
    params.push(isRead ? 1 : 0);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const rows = await query(sql, params);
  return rows.map(row => {
    // Handle metadata - MySQL JSON columns are already parsed, but check if it's a string
    let metadata = null;
    if (row.metadata) {
      if (typeof row.metadata === 'string') {
        try {
          metadata = JSON.parse(row.metadata);
        } catch (e) {
          console.warn('Failed to parse notification metadata:', e);
          metadata = null;
        }
      } else {
        metadata = row.metadata; // Already an object
      }
    }
    
    // Convert MySQL datetime to ISO string for proper timezone handling
    const formatDate = (dateValue) => {
      if (!dateValue) return null;
      // If it's already a Date object or ISO string, return as is
      if (dateValue instanceof Date) {
        return dateValue.toISOString();
      }
      if (typeof dateValue === 'string' && dateValue.includes('T')) {
        return dateValue;
      }
      // MySQL datetime format: convert to ISO
      // MySQL returns datetime in server timezone, but we'll treat it as UTC for consistency
      if (typeof dateValue === 'string' && dateValue.includes(' ')) {
        return new Date(dateValue + 'Z').toISOString();
      }
      return dateValue;
    };
    
    return {
      ...row,
      metadata,
      is_read: Boolean(row.is_read),
      created_at: formatDate(row.created_at),
      updated_at: formatDate(row.updated_at),
      read_at: formatDate(row.read_at)
    };
  });
}

/**
 * Get unread notification count for a member
 */
export async function getUnreadCount(memberId) {
  const result = await query(
    `SELECT COUNT(*) as count 
    FROM notifications 
    WHERE member_id = ? AND is_read = 0`,
    [memberId]
  );
  return result[0]?.count || 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, memberId) {
  await query(
    `UPDATE notifications 
    SET is_read = 1, read_at = NOW() 
    WHERE notification_id = ? AND member_id = ?`,
    [notificationId, memberId]
  );
}

/**
 * Mark all notifications as read for a member
 */
export async function markAllAsRead(memberId) {
  await query(
    `UPDATE notifications 
    SET is_read = 1, read_at = NOW() 
    WHERE member_id = ? AND is_read = 0`,
    [memberId]
  );
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId, memberId) {
  await query(
    `DELETE FROM notifications 
    WHERE notification_id = ? AND member_id = ?`,
    [notificationId, memberId]
  );
}

