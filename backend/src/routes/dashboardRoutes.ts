import { Router } from 'express';
import { getDashboardSummary, getDashboardStats } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/dashboard - Protected routes
router.get('/summary', authMiddleware, getDashboardSummary);
router.get('/stats', authMiddleware, getDashboardStats);
router.get('/', authMiddleware, getDashboardSummary); // Default to summary

export default router;
