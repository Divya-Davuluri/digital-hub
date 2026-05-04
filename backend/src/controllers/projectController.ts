import { Response } from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';

import { randomUUID } from 'crypto';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    
    const allProjects = await db.query.projects.findMany({
      where: eq(projects.tenantId, tenantId),
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });

    res.json(allProjects);
  } catch (err: any) {
    console.error('[GET_PROJECTS_ERROR]', err);
    res.status(500).json({ message: 'Failed to fetch projects: ' + err.message });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, clientName, status, dueDate } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    if (!title || !clientName || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields: title, clientName, dueDate' });
    }

    const [newProject] = await db.insert(projects).values({
      id: randomUUID(),
      tenantId,
      title,
      clientName,
      status: status || 'PLANNING',
      dueDate,
      createdBy: userId,
      completion: 0,
      createdAt: new Date().toISOString()
    }).returning();

    res.status(201).json(newProject);
  } catch (err: any) {
    console.error('[CREATE_PROJECT_ERROR]', err);
    res.status(500).json({ message: 'Failed to create project: ' + err.message });
  }
};
