import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { getProjects, createProject } from '../controllers/projectController';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, AppError } from '../utils/errors';

const router = Router();

// GET /api/projects/clients
router.get('/clients', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;

  const clients = await db.all(sql`
    SELECT id, name, email, company_name, status
    FROM clients
    WHERE tenant_id = ${tenantId}
    ORDER BY name ASC
  `);

  res.json({
    success: true,
    clients: clients || []
  });
}));

// GET /api/projects - List
router.get('/', authMiddleware, getProjects);

// POST /api/projects - Create
router.post('/', authMiddleware, createProject);

// GET /api/projects/:id - Detail
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  let { id } = req.params;
  if (id && id.endsWith('/')) id = id.slice(0, -1);

  const tenantId = req.user.tenantId;

  const projectResult = await db.all(sql`
    SELECT 
      p.*,
      COALESCE(p.client_name, c.name, 'No Client Assigned') as client_name
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.id = ${id}
    AND p.tenant_id = ${tenantId}
    LIMIT 1
  `);

  if (!projectResult || projectResult.length === 0) {
    throw new AppError('Project not found', 404);
  }

  res.json({
    success: true,
    project: projectResult[0]
  });
}));

export default router;
