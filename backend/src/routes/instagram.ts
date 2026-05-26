import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createAutomation,
  getAutomations,
  updateAutomation,
  toggleAutomation,
  deleteAutomation,
  getAutomationStats,
  testTrigger,
} from '../controllers/dmAutomationController';

const router = Router();

// stats MUST come before /:id routes
router.get('/stats', authMiddleware, getAutomationStats);
router.get('/automations', authMiddleware, getAutomations);
router.post('/automations', authMiddleware, createAutomation);
router.put('/automations/:id', authMiddleware, updateAutomation);
router.post('/automations/:id/toggle', authMiddleware, toggleAutomation);
router.post('/automations/:id/test-trigger', authMiddleware, testTrigger);
router.delete('/automations/:id', authMiddleware, deleteAutomation);

export default router;
