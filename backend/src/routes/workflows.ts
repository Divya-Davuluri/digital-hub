import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createWorkflow, getWorkflows, getWorkflow,
  updateWorkflow, deleteWorkflow,
  activateWorkflow, pauseWorkflow,
  getTemplates, createFromTemplate,
} from '../controllers/workflowController';

const router = Router();

// IMPORTANT: templates route must come BEFORE /:id
router.get('/templates', authMiddleware, getTemplates);
router.post('/from-template', authMiddleware, 
  createFromTemplate);
router.post('/', authMiddleware, createWorkflow);
router.get('/', authMiddleware, getWorkflows);
router.get('/:id', authMiddleware, getWorkflow);
router.put('/:id', authMiddleware, updateWorkflow);
router.delete('/:id', authMiddleware, deleteWorkflow);
router.post('/:id/activate', authMiddleware, 
  activateWorkflow);
router.post('/:id/pause', authMiddleware, pauseWorkflow);

export default router;
