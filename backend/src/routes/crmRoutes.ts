import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  addTag,
  markConverted,
  enrollInWorkflow
} from '../controllers/crmController';

const router = Router();

// CRM Contacts CRUD & Management Endpoints (All require user authentication)
router.get('/', authMiddleware, getContacts);
router.get('/:id', authMiddleware, getContact);
router.post('/', authMiddleware, createContact);
router.put('/:id', authMiddleware, updateContact);
router.delete('/:id', authMiddleware, deleteContact);

// Custom CRM Actions
router.post('/:id/tag', authMiddleware, addTag);
router.post('/:id/convert', authMiddleware, markConverted);
router.post('/:id/enroll', authMiddleware, enrollInWorkflow);

export default router;
