import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { 
  getCampaigns, createCampaign, duplicateCampaign, 
  bulkUpdateStatus, getTemplates, getCampaignById,
  getCampaignMetrics
} from '../controllers/campaignController';
import { updateCampaign, deleteCampaign } from '../controllers/agencyController'; // Reusing existing ones for now

const router = Router();

router.get('/', authMiddleware, getCampaigns);
router.get('/metrics', authMiddleware, getCampaignMetrics);
router.get('/templates', authMiddleware, getTemplates);
router.get('/:id', authMiddleware, getCampaignById);

router.post('/', authMiddleware, authorize('admin', 'team'), createCampaign);
router.post('/duplicate/:id', authMiddleware, authorize('admin', 'team'), duplicateCampaign);
router.patch('/bulk-status', authMiddleware, authorize('admin', 'team'), bulkUpdateStatus);
router.patch('/:id', authMiddleware, authorize('admin', 'team'), updateCampaign);
router.delete('/:id', authMiddleware, authorize('admin', 'team'), deleteCampaign);

export default router;
