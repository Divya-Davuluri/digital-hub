import { Router } from 'express';
import { exportReport } from '../controllers/reportController';
import { authMiddleware, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/export', authMiddleware, authorize('admin', 'team'), exportReport);

export default router;
