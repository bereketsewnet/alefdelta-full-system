import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import {
  handleListLoanProducts,
  handleGetLoanProduct,
  handleCreateLoanProduct,
  handleUpdateLoanProduct,
  handleDeleteLoanProduct
} from './loan-product.controller.js';

const router = Router();

// List all loan products (accessible to all authenticated users)
router.get('/', authenticate, handleListLoanProducts);

// Get single loan product
router.get('/:code', authenticate, handleGetLoanProduct);

// Create loan product (Admin only)
router.post('/', authenticate, requireRoles('ADMIN'), handleCreateLoanProduct);

// Update loan product (Admin only)
router.put('/:code', authenticate, requireRoles('ADMIN'), handleUpdateLoanProduct);

// Delete loan product (Admin only)
router.delete('/:code', authenticate, requireRoles('ADMIN'), handleDeleteLoanProduct);

export default router;

