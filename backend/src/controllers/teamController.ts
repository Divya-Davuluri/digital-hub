import { Response } from 'express';
import { db } from '../db';
import { tasks, users, clients, campaigns } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';

// --- Tasks ---

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;
  
  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.tenantId, tenantId),
    orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
  });

  res.json({ success: true, tasks: allTasks });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, client_name, priority, assigned_to } = req.body;
  const tenantId = req.user.tenantId;
  const userId = req.user.id;

  if (!title) {
    throw new AppError('Task title is required', 400);
  }

  const taskId = uuidv4();
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT INTO tasks (
      id, tenant_id, title,
      client_name, priority,
      status, assigned_to,
      created_by, created_at
    ) VALUES (
      ${taskId},
      ${tenantId},
      ${title.trim()},
      ${client_name || null},
      ${priority || 'MEDIUM'},
      'PENDING',
      ${assigned_to || userId},
      ${userId},
      ${now}
    )
  `);

  res.status(201).json({ success: true, id: taskId });
});

// --- Campaigns ---

export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;
  
  const allCampaigns = await db.all(sql`
    SELECT * FROM campaigns 
    WHERE tenant_id = ${tenantId} 
    ORDER BY created_at DESC
  `);

  res.json({ success: true, campaigns: allCampaigns });
});

export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, client_name, budget, platform } = req.body;
  const tenantId = req.user.tenantId;
  const userId = req.user.id;

  if (!name || !client_name) {
    throw new AppError('Name and Client Name are required', 400);
  }

  const campaignId = uuidv4();
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT INTO campaigns (
      id, tenant_id, name, client_name,
      status, budget, platform,
      created_by, created_at
    ) VALUES (
      ${campaignId},
      ${tenantId},
      ${name},
      ${client_name},
      'ACTIVE',
      ${budget || 0},
      ${platform || 'google'},
      ${userId},
      ${now}
    )
  `);

  res.status(201).json({ success: true, id: campaignId });
});

// --- Clients ---

export const getClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;

  const allClients = await db.all(sql`
    SELECT * FROM clients 
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
  `);

  res.json({ success: true, clients: allClients });
});

export const createClient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, company_name } = req.body;
  const tenantId = req.user.tenantId;

  if (!name || !email) {
    throw new AppError('Name and Email are required', 400);
  }

  const clientId = uuidv4();
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT INTO clients (
      id, tenant_id, name, email,
      company_name, status, created_at
    ) VALUES (
      ${clientId},
      ${tenantId},
      ${name},
      ${email},
      ${company_name || null},
      'ACTIVE',
      ${now}
    )
  `);

  res.status(201).json({ success: true, id: clientId });
});
