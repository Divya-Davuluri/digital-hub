import { Router } from 'express';
import { getBranding, updateBranding } from '../controllers/brandingController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getBranding); // Publicly accessible for UI application
router.post('/', authMiddleware, authorize('admin'), updateBranding);
router.put('/', authMiddleware, authorize('admin'), updateBranding);

export default router;
