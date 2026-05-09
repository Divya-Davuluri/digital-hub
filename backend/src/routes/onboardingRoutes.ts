import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { completeClientOnboarding } from '../controllers/onboardingController';

const router = Router();

router.post('/client/complete', authMiddleware, authorize('client'), completeClientOnboarding);

export default router;
