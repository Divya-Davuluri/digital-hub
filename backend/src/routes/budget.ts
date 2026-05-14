import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createBudgetPool,
  getBudgetPools,
  getBudgetPool,
  updateAllocation,
  reallocateBudget,
  updateChannelMetrics,
  deleteBudgetPool,
} from '../controllers/budgetController';

const router = Router();

router.post('/pools', authMiddleware, createBudgetPool);
router.get('/pools', authMiddleware, getBudgetPools);
router.get('/pools/:poolId', authMiddleware, getBudgetPool);
router.post('/pools/:poolId/reallocate', authMiddleware, reallocateBudget);
router.put('/allocations/:id', authMiddleware, updateAllocation);
router.post('/allocations/:id/metrics', authMiddleware, updateChannelMetrics);
router.delete('/pools/:poolId', authMiddleware, deleteBudgetPool);

export default router;
