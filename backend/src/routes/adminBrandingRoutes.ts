import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { getBranding, updateBranding } from '../controllers/brandingController';

const router = Router();

// Step 2: GET and PUT /api/admin/branding
router.get('/', authMiddleware, authorize('admin'), getBranding);
router.put('/', authMiddleware, authorize('admin'), updateBranding);

export default router;
