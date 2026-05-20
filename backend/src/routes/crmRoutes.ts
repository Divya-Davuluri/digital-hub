import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
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

// CRM Contacts CRUD & Management Endpoints (All require user authentication and role validation)
router.use(authMiddleware);
router.use(authorize('admin', 'team'));

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

// Custom CRM Actions
router.post('/:id/tag', addTag);
router.post('/:id/convert', markConverted);
router.post('/:id/enroll', enrollInWorkflow);

// Notes Actions
router.post('/:id/notes', createNote);
router.put('/:id/notes/:noteId', updateNote);
router.delete('/:id/notes/:noteId', deleteNote);

export default router;
