import * as notificationService from './notification.service.js';

/**
 * Get notifications for the authenticated member
 * GET /api/client/notifications
 */
export async function handleGetNotifications(req, res, next) {
  try {
    const memberId = req.user.memberId;
    const { is_read, limit, offset } = req.query;
    
    const filters = {
      is_read: is_read !== undefined ? is_read === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    };
    
    const notifications = await notificationService.getMemberNotifications(memberId, filters);
    res.json({ data: notifications });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count
 * GET /api/client/notifications/unread-count
 */
export async function handleGetUnreadCount(req, res, next) {
  try {
    const memberId = req.user.memberId;
    const count = await notificationService.getUnreadCount(memberId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 * PUT /api/client/notifications/:notificationId/read
 */
export async function handleMarkAsRead(req, res, next) {
  try {
    const memberId = req.user.memberId;
    const { notificationId } = req.params;
    await notificationService.markAsRead(notificationId, memberId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read
 * PUT /api/client/notifications/read-all
 */
export async function handleMarkAllAsRead(req, res, next) {
  try {
    const memberId = req.user.memberId;
    await notificationService.markAllAsRead(memberId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete notification
 * DELETE /api/client/notifications/:notificationId
 */
export async function handleDeleteNotification(req, res, next) {
  try {
    const memberId = req.user.memberId;
    const { notificationId } = req.params;
    await notificationService.deleteNotification(notificationId, memberId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
