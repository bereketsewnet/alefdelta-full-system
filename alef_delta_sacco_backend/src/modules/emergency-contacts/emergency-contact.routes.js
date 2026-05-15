import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import {
  handleListEmergencyContacts,
  handleGetEmergencyContact,
  handleCreateEmergencyContact,
  handleUpdateEmergencyContact,
  handleDeleteEmergencyContact
} from './emergency-contact.controller.js';

const router = Router();
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER', 'AUDITOR'];

// Get all emergency contacts for a member
router.get('/member/:memberId', authenticate, requireRoles(...staffRoles), handleListEmergencyContacts);

// Get single emergency contact
router.get('/:contactId', authenticate, requireRoles(...staffRoles), handleGetEmergencyContact);

// Create emergency contact
router.post(
  '/member/:memberId',
  authenticate,
  requireRoles(...staffRoles),
  handleCreateEmergencyContact
);

// Update emergency contact
router.put(
  '/:contactId',
  authenticate,
  requireRoles(...staffRoles),
  handleUpdateEmergencyContact
);

// Delete emergency contact
router.delete('/:contactId', authenticate, requireRoles(...staffRoles), handleDeleteEmergencyContact);

export default router;

