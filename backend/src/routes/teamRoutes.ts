import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { 
  getTasks, createTask, 
  getCampaigns, createCampaign,
  getClients
} from '../controllers/teamController';

const router = Router();

// All routes here require team or admin role
router.use(authMiddleware);
router.use(authorize('team', 'admin'));

// Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);

// Clients
router.get('/clients', getClients);

export default router;
