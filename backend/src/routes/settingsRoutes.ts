import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { 
  getProfile, 
  updateProfile, 
  updatePassword, 
  getWorkspaces 
} from '../controllers/settingsController';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/password', authMiddleware, updatePassword);
router.get('/workspaces', authMiddleware, authorize('admin'), getWorkspaces);

export default router;
