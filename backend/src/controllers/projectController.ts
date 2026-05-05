import { Response } from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { randomUUID } from 'crypto';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    
    // Use raw SQL to handle potential schema mismatches during transition
    const results = await db.run(sql`
      SELECT * FROM projects 
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `);

    const allProjects = results.rows || results;
    res.json(allProjects);
  } catch (err: any) {
    console.error('[GET_PROJECTS_ERROR]', err);
    res.status(500).json({ message: 'Failed to fetch projects: ' + err.message });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, title, projectName, clientId, clientName, status, targetDate, dueDate } = req.body;
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const userId = req.user.id || req.user.userId;

    // Support both old and new naming conventions during migration
    const finalName = name || projectName || title;
    const finalClientId = clientId || clientName;
    const finalDate = targetDate || dueDate;

    console.log('[CREATE_PROJECT_REQUEST]', { body: req.body, tenantId, userId });

    if (!finalName || !finalClientId || !finalDate) {
      return res.status(400).json({ 
        message: 'Missing required fields: projectName, clientId, targetDate' 
      });
    }

    const projectId = randomUUID();
    const createdAt = new Date().toISOString();

    // Use raw SQL to ensure compatibility with the updated table
    await db.run(sql`
      INSERT INTO projects (
        id, tenant_id, name, client_id, target_date, status, created_at
      ) VALUES (
        ${projectId}, ${tenantId}, ${finalName}, ${finalClientId}, ${finalDate}, ${status || 'Planning'}, ${createdAt}
      )
    `);

    console.log('[PROJECT_CREATED]', projectId);

    res.status(201).json({
      id: projectId,
      name: finalName,
      clientId: finalClientId,
      targetDate: finalDate,
      status: status || 'Planning',
      createdAt
    });
  } catch (err: any) {
    console.error('[CREATE_PROJECT_ERROR]', err);
    res.status(500).json({ message: 'Failed to create project: ' + err.message });
  }
};
