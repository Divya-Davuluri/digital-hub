import { Router } from 'express';
import { authMiddleware as authenticate } from '../middleware/authMiddleware';
import {
  getKeywords, addKeyword, deleteKeyword,
  runSiteAudit, getAuditIssues,
  generateContentBrief, getContentBriefs,
  getCompetitorGap, getSEOStats,
  generateBrief, getBriefs, deleteBrief,
} from '../controllers/seoController';

const router = Router();

// Stats first — before parameterized routes
router.get('/stats', authenticate, getSEOStats);
router.get('/keywords', authenticate, getKeywords);
router.post('/keywords', authenticate, addKeyword);
router.delete('/keywords/:id', authenticate, deleteKeyword);
router.post('/audit', authenticate, runSiteAudit);
router.get('/audit', authenticate, getAuditIssues);
router.post('/content-brief', authenticate, generateContentBrief);
router.get('/content-briefs', authenticate, getContentBriefs);
router.get('/competitor-gap', authenticate, getCompetitorGap);

// New SEO briefs endpoints
router.post('/briefs', authenticate, generateBrief);
router.get('/briefs', authenticate, getBriefs);
router.delete('/briefs/:id', authenticate, deleteBrief);

export default router;
