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

    const project = await db.run(sql`
      SELECT 
        p.*,
        COALESCE(p.client_name, c.name, 'No Client') as client_name
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE p.id = ${id}
      AND p.tenant_id = ${tenantId}
      LIMIT 1
    `);

    const rows = project.rows || project;

    if (!rows || rows.length === 0) {
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
    console.error('Fetch project error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

export default router;
