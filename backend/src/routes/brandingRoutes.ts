import { Router } from 'express';
import { getBranding, updateBranding, getDomainStatus, addDomain, deleteDomain } from '../controllers/brandingController';
import { authMiddleware, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getBranding); 
router.post('/', authMiddleware, authorize('admin'), updateBranding);
router.put('/', authMiddleware, authorize('admin'), updateBranding);

// Domain Routes
router.get('/domain', authMiddleware, authorize('admin'), getDomainStatus);
router.post('/domain', authMiddleware, authorize('admin'), addDomain);
router.delete('/domain/:id', authMiddleware, authorize('admin'), deleteDomain);

export default router;
