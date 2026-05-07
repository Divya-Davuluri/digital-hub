import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getProjects, createProject } from '../controllers/projectController';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, AppError } from '../utils/errors';

const router = Router();

// GET /api/projects/clients
router.get('/clients', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, workspaceId, role } = req.user as any;

  // Strict isolation for clients
  const clients = await db.all(sql`
    SELECT id, name, email, company_name, status
    FROM clients
    WHERE tenant_id = ${tenantId}
    ${(role === 'client' && workspaceId) ? sql`AND workspace_id = ${workspaceId}` : sql``}
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
router.get('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  let { id } = req.params;
  if (id && id.endsWith('/')) id = id.slice(0, -1);

  const { tenantId, workspaceId, role } = req.user as any;

  const projectResult = await db.all(sql`
    SELECT p.*
    FROM projects p
    WHERE p.id = ${id}
    AND p.tenant_id = ${tenantId}
    ${(role === 'client' && workspaceId) ? sql`AND p.workspace_id = ${workspaceId}` : sql``}
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
