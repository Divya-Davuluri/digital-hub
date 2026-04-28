import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/dashboard - Protected route
router.get('/', authMiddleware, getDashboardData);

export default router;
