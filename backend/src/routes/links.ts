import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createBioPage, getBioPages,
  updateBioPage, deleteBioPage,
  getBioPageBySlug, createShortLink,
  getShortLinks, deleteShortLink,
  trackClick, trackClickApi, getLinkAnalytics,
} from '../controllers/linkController';

const router = Router();

// Bio Pages (authenticated)
router.post('/bio-pages', authMiddleware, createBioPage);
router.get('/bio-pages', authMiddleware, getBioPages);
router.put('/bio-pages/:id', authMiddleware, updateBioPage);
router.delete('/bio-pages/:id', authMiddleware, deleteBioPage);

// Short Links (authenticated)
router.post('/short', authMiddleware, createShortLink);
router.get('/short', authMiddleware, getShortLinks);
router.delete('/short/:id', authMiddleware, deleteShortLink);
router.get('/analytics/:linkId', authMiddleware, getLinkAnalytics);


// Public routes (no auth)
router.get('/bio/:slug', getBioPageBySlug);
router.get('/l/:shortCode', trackClick);
router.get('/track/:shortCode', trackClickApi);

export default router;
