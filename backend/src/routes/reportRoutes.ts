import { Router } from 'express';
import { 
  exportReport, 
  requestCustomReport, 
  getReportRequests, 
  exportClientPDF,
  exportSingleCampaignPDF,
  downloadClientReport
} from '../controllers/reportController';
import { authMiddleware, authorize } from '../middleware/authMiddleware';

const router = Router();

// General exports
router.get('/export', authMiddleware, authorize('admin', 'team'), exportReport);

// Client-specific report requests
router.post('/request', authMiddleware, requestCustomReport);
router.get('/client-pdf', authMiddleware, exportClientPDF);
router.get('/campaigns/:campaignId/pdf', authMiddleware, exportSingleCampaignPDF);
router.get('/:reportId/download', authMiddleware, downloadClientReport);

// Admin-specific retrieval
router.get('/requests', authMiddleware, authorize('admin', 'team'), getReportRequests);

export default router;
