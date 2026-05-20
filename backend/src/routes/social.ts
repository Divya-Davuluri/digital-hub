import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import {
  createPost, getPosts, updatePost, deletePost,
  approvePost, rejectPost, getBestTimes,
  getContentLibrary, addToLibrary,
} from '../controllers/socialController';

const router = Router();

router.use(authMiddleware);
router.use(authorize('admin', 'team'));

router.post('/posts', createPost);
router.get('/posts', getPosts);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/approve', approvePost);
router.post('/posts/:id/reject', rejectPost);
router.get('/best-times', getBestTimes);
router.get('/library', getContentLibrary);
router.post('/library', addToLibrary);

export default router;
