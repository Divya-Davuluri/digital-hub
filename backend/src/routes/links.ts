import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createBioPage, getBioPages, getBioPageById,
  updateBioPage, deleteBioPage,
  getBioPageBySlug, trackBioLinkClick, createShortLink,
  getShortLinks, deleteShortLink,
  trackClick, trackClickApi, getLinkAnalytics,
} from '../controllers/linkController';

const router = Router();

// Bio Pages (authenticated)
router.post('/bio-pages', authMiddleware, createBioPage);
router.get('/bio-pages', authMiddleware, getBioPages);
router.get('/bio-pages/:id', authMiddleware, getBioPageById);
router.put('/bio-pages/:id', authMiddleware, updateBioPage);
router.delete('/bio-pages/:id', authMiddleware, deleteBioPage);

// Short Links (authenticated)
router.post('/short', authMiddleware, createShortLink);
router.get('/short', authMiddleware, getShortLinks);
router.delete('/short/:id', authMiddleware, deleteShortLink);
router.get('/analytics/:linkId', authMiddleware, getLinkAnalytics);


// Public routes (no auth)
router.get('/bio/:slug', getBioPageBySlug);
router.post('/bio/:slug/click/:linkId', trackBioLinkClick);
router.get('/l/:shortCode', trackClick);
router.get('/track/:shortCode', trackClickApi);

export default router;
