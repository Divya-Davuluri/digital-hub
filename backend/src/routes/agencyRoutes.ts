import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { 
  getClients, createClient, updateClient, deleteClient,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getAgencyStats, getTeamMembers
} from '../controllers/agencyController';

const router = Router();

// --- Agency Admin & Team Routes ---
router.get('/team-members', authMiddleware, authorize('admin'), getTeamMembers);
router.get('/stats', authMiddleware, authorize('admin', 'team'), getAgencyStats);
router.get('/clients', authMiddleware, authorize('admin', 'team'), getClients);
router.post('/clients', authMiddleware, authorize('admin', 'team'), createClient);
router.patch('/clients/:id', authMiddleware, authorize('admin', 'team'), updateClient);
router.delete('/clients/:id', authMiddleware, authorize('admin', 'team'), deleteClient);
router.get('/campaigns', authMiddleware, authorize('admin', 'team', 'client'), getCampaigns);
router.post('/campaigns', authMiddleware, authorize('admin', 'team'), createCampaign);
router.patch('/campaigns/:id', authMiddleware, authorize('admin', 'team'), updateCampaign);
router.delete('/campaigns/:id', authMiddleware, authorize('admin', 'team'), deleteCampaign);

export default router;
