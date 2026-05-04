import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getProjects, createProject } from '../controllers/projectController';

const router = Router();

router.get('/', authMiddleware, getProjects);
router.post('/', authMiddleware, createProject);

export default router;
