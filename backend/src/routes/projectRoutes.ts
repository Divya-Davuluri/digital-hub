import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getProjects, createProject } from '../controllers/projectController';

const router = Router();

import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';

router.get('/', authMiddleware, getProjects);
router.post('/', authMiddleware, createProject);

router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    console.log('[GET_PROJECT_DETAIL] Fetching project:', id, 'for tenant:', tenantId);

    const projectResult = await db.run(sql`
      SELECT 
        p.*,
        COALESCE(p.client_name, c.name, 'No Client Assigned') as client_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE p.id = ${id}
      AND p.tenant_id = ${tenantId}
      LIMIT 1
    `);

    const rows = projectResult.rows || projectResult;
    console.log('[GET_PROJECT_DETAIL] Results count:', rows?.length || 0);

    if (!rows || rows.length === 0) {
      console.warn('[GET_PROJECT_DETAIL] Project not found or tenant mismatch:', id);
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    return res.json({
      success: true,
      project: rows[0]
    });

  } catch (error: any) {
    console.error('[GET_PROJECT_DETAIL_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
      details: error.message
    });
  }
});

export default router;
