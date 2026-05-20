import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { 
  getClients, createClient, updateClient, deleteClient,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getAgencyStats, getTeamMembers, getRecentTransactions
} from '../controllers/agencyController';

const router = Router();

// --- Agency Admin & Team Routes ---
router.get('/team-members', authMiddleware, authorize('admin'), getTeamMembers);
router.get('/stats', authMiddleware, authorize('admin', 'team'), getAgencyStats);
router.get('/transactions', authMiddleware, authorize('admin', 'team'), getRecentTransactions);
router.get('/clients', authMiddleware, authorize('admin', 'team'), getClients);
router.post('/clients', authMiddleware, authorize('admin'), createClient);
router.patch('/clients/:id', authMiddleware, authorize('admin'), updateClient);
router.delete('/clients/:id', authMiddleware, authorize('admin'), deleteClient);

export default router;
