import express, { Router } from 'express';
import { authMiddleware as authenticate } from '../middleware/authMiddleware';
import {
  getSubscription, createCheckoutSession,
  cancelSubscription, stripeWebhook,
  getInvoices, createPortalSession,
} from '../controllers/billingController';

const router = Router();

// Webhook needs raw body — register BEFORE json parser
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Enable JSON parsing middleware for subsequent routes
router.use(express.json());

router.get('/subscription',
  authenticate, getSubscription);
router.post('/checkout',
  authenticate, createCheckoutSession);
router.post('/portal',
  authenticate, createPortalSession);
router.post('/cancel',
  authenticate, cancelSubscription);
router.get('/invoices',
  authenticate, getInvoices);

export default router;
