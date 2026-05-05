import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getProjects, createProject } from '../controllers/projectController';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';

const router = Router();

// 1. GET /api/projects/clients - MUST BE FIRST to avoid conflict with /:id
router.get('/clients', authMiddleware, async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id;
    console.log('[PROJECT_CLIENTS] Fetching for tenant:', tenantId);

    const clients = await db.all(sql`
      SELECT id, name, email, company_name, status
      FROM clients
      WHERE tenant_id = ${tenantId}
      ORDER BY name ASC
    `);

    console.log('[PROJECT_CLIENTS] Found:', clients?.length || 0);

    return res.json({
      success: true,
      clients: clients || []
    });
  } catch (error: any) {
    console.error('[PROJECT_CLIENTS_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      clients: [],
      error: error.message
    });
  }
});

// 2. GET /api/projects - List
router.get('/', authMiddleware, getProjects);

// 3. POST /api/projects - Create
router.post('/', authMiddleware, createProject);

// 4. GET /api/projects/:id - Detail (MUST BE AFTER /clients)
router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    let { id } = req.params;
    // Sanitize ID
    if (id && id.endsWith('/')) {
      id = id.slice(0, -1);
    }

    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    console.log('[GET_PROJECT_DETAIL] Sanitized ID:', id);
    console.log('[GET_PROJECT_DETAIL] User Tenant ID:', tenantId);

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
