import { Response } from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { randomUUID } from 'crypto';
import { asyncHandler, AppError } from '../utils/errors';

export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;

  const results = await db.all(sql`
    SELECT 
      p.*,
      COALESCE(p.client_name, c.name, 'No Client') as client_name,
      COALESCE(p.client_name, c.name, 'No Client') as clientName
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.tenant_id = ${tenantId}
    ORDER BY p.created_at DESC
  `);

  res.json(results);
});

export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    name, 
    projectName, 
    title, 
    clientId, 
    clientName, 
    status, 
    targetDate, 
    dueDate,
    description
  } = req.body;

  const tenantId = req.user.tenantId;
  const userId = req.user.id;

  const finalName = projectName || name || title;
  const finalStatus = (status || 'Planning').toUpperCase();
  const finalClientId = clientId || null;
  const finalClientName = clientName || 'General';
  const finalDate = targetDate || dueDate || null;

  if (!finalName) {
    throw new AppError('Project name is required', 400);
  }

  const projectId = randomUUID();
  const createdAt = new Date().toISOString();

  await db.run(sql`
    INSERT INTO projects (
      id, tenant_id, name, title, client_id, client_name,
      target_date, due_date, status, completion,
      description, created_by, created_at
    ) VALUES (
      ${projectId}, ${tenantId}, ${finalName}, ${finalName}, ${finalClientId}, ${finalClientName},
      ${finalDate}, ${finalDate}, ${finalStatus}, 0,
      ${description || null}, ${userId}, ${createdAt}
    )
  `);

  res.status(201).json({
    success: true,
    project: {
      id: projectId,
      name: finalName,
      clientName: finalClientName,
      targetDate: finalDate,
      status: finalStatus,
      completion: 0,
      createdAt: createdAt
    }
  });
});
