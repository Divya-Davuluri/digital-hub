import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getChannelBreakdown,
  getCampaignPerformance,
  exportAnalyticsPDF,
} from '../controllers/analyticsController';

const router = Router();
router.get('/overview', authMiddleware, getAnalyticsOverview);
router.get('/timeseries', authMiddleware, getAnalyticsTimeseries);
router.get('/channels', authMiddleware, getChannelBreakdown);
router.get('/campaigns', authMiddleware, getCampaignPerformance);
router.post('/export-pdf', authMiddleware, exportAnalyticsPDF);

export default router;
