import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createPost, getPosts, updatePost, deletePost,
  approvePost, rejectPost, getBestTimes,
  getContentLibrary, addToLibrary,
} from '../controllers/socialController';

const router = Router();

router.post('/posts', authMiddleware, createPost);
router.get('/posts', authMiddleware, getPosts);
router.put('/posts/:id', authMiddleware, updatePost);
router.delete('/posts/:id', authMiddleware, deletePost);
router.post('/posts/:id/approve', authMiddleware, approvePost);
router.post('/posts/:id/reject', authMiddleware, rejectPost);
router.get('/best-times', authMiddleware, getBestTimes);
router.get('/library', authMiddleware, getContentLibrary);
router.post('/library', authMiddleware, addToLibrary);

export default router;
