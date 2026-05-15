import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleDeleteNotification
} from './notification.controller.js';

const router = Router();

// All notification endpoints require member authentication
const requireMember = (req, res, next) => {
  if (req.user.subjectType !== 'MEMBER') {
    return res.status(403).json({ message: 'Member access only' });
  }
  next();
};

// Get notifications
router.get('/', authenticate, requireMember, handleGetNotifications);

// Get unread count
router.get('/unread-count', authenticate, requireMember, handleGetUnreadCount);

// Mark as read
router.put('/:notificationId/read', authenticate, requireMember, handleMarkAsRead);

// Mark all as read
router.put('/read-all', authenticate, requireMember, handleMarkAllAsRead);

// Delete notification
router.delete('/:notificationId', authenticate, requireMember, handleDeleteNotification);

export default router;
