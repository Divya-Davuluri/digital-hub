import { Router } from 'express';
import { submitContactForm } from '../controllers/contactController';

const router = Router();

// Public Contact Form submission route
router.post('/', submitContactForm);

export default router;
