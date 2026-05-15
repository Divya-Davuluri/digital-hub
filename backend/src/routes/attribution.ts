import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  calculateAttribution,
  getAttributionResults,
  getCustomerJourney,
  getAttributionComparison,
} from '../controllers/attributionController';

const router = Router();
router.post('/calculate', authMiddleware, calculateAttribution);
router.get('/results', authMiddleware, getAttributionResults);
router.get('/journey', authMiddleware, getCustomerJourney);
router.get('/comparison', authMiddleware, getAttributionComparison);

export default router;
