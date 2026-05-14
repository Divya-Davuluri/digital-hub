import { Router } from 'express';
import { getBranding, updateBranding, getDomainStatus, addDomain, deleteDomain, uploadBrandingAsset } from '../controllers/brandingController';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getBranding); 
router.post('/', authMiddleware, authorize('admin'), updateBranding);
router.put('/', authMiddleware, authorize('admin'), updateBranding);

// FIX 3: Register Cloudinary upload route
router.post('/upload', authMiddleware, authorize('admin'), upload.single('file'), uploadBrandingAsset);

// Domain Routes
router.get('/domain', authMiddleware, authorize('admin'), getDomainStatus);
router.post('/domain', authMiddleware, authorize('admin'), addDomain);
router.delete('/domain/:id', authMiddleware, authorize('admin'), deleteDomain);

export default router;
