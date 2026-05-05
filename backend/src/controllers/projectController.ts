import { Response } from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { randomUUID } from 'crypto';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    
    // Fetch all columns for the project pipeline
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

    const tenantId = req.user.tenantId || req.user.tenant_id;
    const userId = req.user.id || req.user.userId;

    // Field Mapping & Normalization
    const finalName = projectName || name || title;
    const finalStatus = (status || 'Planning').toUpperCase();
    const finalClientId = clientId || null;
    const finalClientName = clientName || 'General';
    const finalDate = targetDate || dueDate || null;

    console.log('[CREATE_PROJECT_REQUEST]', { 
      body: req.body, 
      mapped: { finalName, finalClientId, finalDate, finalStatus },
      tenantId, 
      userId 
    });

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const projectId = randomUUID();
    const createdAt = new Date().toISOString();

    // EXHAUSTIVE INSERT - Handles all schema variations for stability
    await db.run(sql`
      INSERT INTO projects (
        id,
        tenant_id,
        name,
        title,
        client_id,
        client_name,
        target_date,
        due_date,
        status,
        completion,
        description,
        created_by,
        created_at
      ) VALUES (
        ${projectId},
        ${tenantId},
        ${finalName},
        ${finalName},
        ${finalClientId},
        ${finalClientName},
        ${finalDate},
        ${finalDate},
        ${finalStatus},
        0,
        ${description || null},
        ${userId},
        ${createdAt}
      )
    `);

    console.log('[PROJECT_CREATED_SUCCESS]', projectId);

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
  } catch (err: any) {
    console.error('[CREATE_PROJECT_ERROR]', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project: ' + err.message,
      details: err.message 
    });
  }
};
