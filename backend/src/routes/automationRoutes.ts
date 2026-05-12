import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as automationController from '../controllers/automationController';

const router = Router();

// Apply auth to all routes
router.use(authMiddleware);

// Budget Pools
router.get('/pools', automationController.getBudgetPools);
router.post('/pools', automationController.createBudgetPool);

// Automation Rules
router.get('/rules', automationController.getRules);
router.post('/rules', automationController.createRule);
router.patch('/rules/:id/toggle', automationController.toggleRule);

// Execution & Insights
router.post('/run-checks', automationController.runAutomationChecks);
router.get('/forecast/:targetId', automationController.getForecast);

export default router;
