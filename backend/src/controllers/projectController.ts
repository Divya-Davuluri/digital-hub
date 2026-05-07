import { Response } from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { asyncHandler, AppError } from '../utils/errors';

export const getProjects = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId, role } = req.user;
  const targetWorkspaceId = workspaceId || req.query.workspaceId;

  if (!targetWorkspaceId && role === 'client') {
    throw new AppError('Workspace context required', 403);
  }

  const results = await db.all(sql`
    SELECT p.*
    FROM projects p
    WHERE p.tenant_id = ${tenantId}
    ${targetWorkspaceId ? sql`AND p.workspace_id = ${targetWorkspaceId}` : sql``}
    ORDER BY p.created_at DESC
  `);

  res.json(results);
});

export const createProject = asyncHandler(async (req: any, res: Response) => {
  const { 
    title, 
    workspaceId: bodyWorkspaceId,
    clientName, 
    status, 
    dueDate,
    description
  } = req.body;

  const { tenantId, id: userId, workspaceId: tokenWorkspaceId } = req.user;
  const targetWorkspaceId = tokenWorkspaceId || bodyWorkspaceId;

  if (!title) throw new AppError('Title is required', 400);
  if (!targetWorkspaceId) throw new AppError('Workspace ID is required', 400);

  const projectId = randomUUID();
  const createdAt = new Date().toISOString();

  await db.run(sql`
    INSERT INTO projects (
      id, tenant_id, workspace_id, title, client_name,
      due_date, status, completion,
      created_by, created_at
    ) VALUES (
      ${projectId}, ${tenantId}, ${targetWorkspaceId}, ${title}, ${clientName || 'General'},
      ${dueDate || null}, ${status || 'PLANNING'}, 0,
      ${userId}, ${createdAt}
    )
  `);

  res.status(201).json({
    success: true,
    project: {
      id: projectId,
      title,
      workspaceId: targetWorkspaceId,
      status: status || 'PLANNING',
      completion: 0,
      createdAt: createdAt
    }
  });
});
