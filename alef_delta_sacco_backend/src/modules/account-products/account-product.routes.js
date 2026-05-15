import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import {
  handleListAccountProducts,
  handleGetAccountProduct,
  handleCreateAccountProduct,
  handleUpdateAccountProduct,
  handleDeleteAccountProduct
} from './account-product.controller.js';

const router = Router();

// List all account products (accessible to all authenticated users)
router.get('/', authenticate, handleListAccountProducts);

// Get single account product
router.get('/:code', authenticate, handleGetAccountProduct);

// Create account product (Admin only)
router.post('/', authenticate, requireRoles('ADMIN'), handleCreateAccountProduct);

// Update account product (Admin only)
router.put('/:code', authenticate, requireRoles('ADMIN'), handleUpdateAccountProduct);

// Delete account product (Admin only)
router.delete('/:code', authenticate, requireRoles('ADMIN'), handleDeleteAccountProduct);

export default router;

