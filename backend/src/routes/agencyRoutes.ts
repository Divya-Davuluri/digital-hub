import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { 
  getClients, createClient, 
  getCampaigns, createCampaign,
  getAgencyStats 
} from '../controllers/agencyController';

const router = Router();

// --- Agency Admin & Team Routes ---
router.get('/stats', authMiddleware, authorize(['admin', 'team']), getAgencyStats);
router.get('/clients', authMiddleware, authorize(['admin', 'team']), getClients);
router.post('/clients', authMiddleware, authorize(['admin', 'team']), createClient);
router.get('/campaigns', authMiddleware, authorize(['admin', 'team', 'client']), getCampaigns);
router.post('/campaigns', authMiddleware, authorize(['admin', 'team']), createCampaign);

export default router;
