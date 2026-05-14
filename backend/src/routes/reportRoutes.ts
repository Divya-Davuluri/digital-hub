import { Router } from 'express';
import { 
  getReports,
  createReport,
  getReportById,
  downloadReport,
  deleteReport
} from '../controllers/reportController';
import { authMiddleware, authorize } from '../middleware/authMiddleware';

const router = Router();

// End-to-end Report Routes
router.get('/', authMiddleware, getReports);
router.post('/', authMiddleware, authorize('admin', 'team'), createReport);
router.get('/:id', authMiddleware, getReportById);
router.get('/:id/download', authMiddleware, downloadReport);
router.delete('/:id', authMiddleware, authorize('admin', 'team'), deleteReport);

export default router;
