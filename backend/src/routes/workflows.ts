import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import {
  createWorkflow, getWorkflows, getWorkflow,
  updateWorkflow, deleteWorkflow,
  activateWorkflow, pauseWorkflow,
  getTemplates, createFromTemplate,
} from '../controllers/workflowController';

const router = Router();

router.use(authMiddleware);
router.use(authorize('admin', 'team'));

// IMPORTANT: templates route must come BEFORE /:id
router.get('/templates', getTemplates);
router.post('/from-template', createFromTemplate);
router.post('/', createWorkflow);
router.get('/', getWorkflows);
router.get('/:id', getWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);
router.post('/:id/activate', activateWorkflow);
router.post('/:id/pause', pauseWorkflow);

export default router;
