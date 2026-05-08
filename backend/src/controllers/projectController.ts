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

  await db.insert(projects).values({
    id: projectId,
    tenantId,
    workspaceId: targetWorkspaceId,
    name: title, // Required by DB
    title: title,
    clientId: req.body.clientId || null,
    clientName: clientName || 'General',
    status: status || 'PLANNING',
    dueDate: dueDate || null,
    targetDate: dueDate || null,
    description: description || '',
    createdBy: userId,
    createdAt: createdAt,
    updatedAt: createdAt
  });

  res.status(201).json({
    success: true,
    project: {
      id: projectId,
      title,
      name: title,
      workspaceId: targetWorkspaceId,
      status: status || 'PLANNING',
      completion: 0,
      createdAt: createdAt
    }
  });
});
