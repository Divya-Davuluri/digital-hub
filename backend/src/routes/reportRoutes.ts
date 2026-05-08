import { Router } from 'express';
import { exportReport, requestCustomReport, getReportRequests, exportClientPDF } from '../controllers/reportController';
import { authMiddleware, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/export', authMiddleware, authorize('admin', 'team'), exportReport);
router.post('/request', authMiddleware, authorize('client', 'admin'), requestCustomReport);
router.get('/requests', authMiddleware, authorize('admin', 'team'), getReportRequests);
router.get('/client-pdf', authMiddleware, authorize('client', 'admin'), exportClientPDF);

export default router;
