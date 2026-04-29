import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getTasks, createTask, updateTaskStatus } from '../controllers/taskController';

const router = Router();

router.get('/', authMiddleware, getTasks);
router.post('/', authMiddleware, createTask);
router.patch('/:id/status', authMiddleware, updateTaskStatus);

export default router;
