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
  enrollInWorkflow,
  createNote,
  updateNote,
  deleteNote
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

// Notes Actions
router.post('/:id/notes', authMiddleware, createNote);
router.put('/:id/notes/:noteId', authMiddleware, updateNote);
router.delete('/:id/notes/:noteId', authMiddleware, deleteNote);

export default router;
