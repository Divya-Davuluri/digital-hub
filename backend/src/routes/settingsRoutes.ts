import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { 
  getProfile, 
  updateProfile, 
  updatePassword, 
  getWorkspaces 
} from '../controllers/settingsController';
import { getBranding, updateBranding, uploadBrandingAsset } from '../controllers/brandingController';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/password', authMiddleware, updatePassword);
router.get('/workspaces', authMiddleware, authorize('admin'), getWorkspaces);
router.get('/branding', authMiddleware, getBranding);
router.put('/branding', authMiddleware, authorize('admin'), updateBranding);
router.post('/branding/upload', authMiddleware, authorize('admin'), upload.single('file'), uploadBrandingAsset);

export default router;
