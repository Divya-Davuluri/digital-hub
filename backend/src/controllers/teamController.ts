import { Request, Response } from 'express';
import { db } from '../db';
import { tasks, users, clients, campaigns, workspaces } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';
import bcrypt from 'bcryptjs';

// --- Tasks ---

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, workspaceId, role } = req.user as any;
  
  // ROLE-BASED ISOLATION: 
  // Clients only see their workspace. 
  // Admins/Team see workspace-specific tasks if context is provided, else agency tasks.
  const filterWorkspaceId = workspaceId || req.query.workspaceId;

  if (!filterWorkspaceId && role === 'client') {
    throw new AppError('Unauthorized: Workspace context required', 403);
  }

  const allTasks = await db.query.tasks.findMany({
    where: filterWorkspaceId 
      ? and(eq(tasks.tenantId, tenantId), eq(tasks.workspaceId, filterWorkspaceId as string))
      : eq(tasks.tenantId, tenantId),
    orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
  });

  res.json({ success: true, tasks: allTasks });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { title, client_name, priority, assigned_to } = req.body;
  const { tenantId, workspaceId, id: userId } = req.user as any;
  
  const targetWorkspaceId = workspaceId || req.body.workspaceId;

  if (!title) throw new AppError('Task title is required', 400);
  if (!targetWorkspaceId) throw new AppError('Workspace ID is required', 400);

  const taskId = uuidv4();
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT INTO tasks (
      id, tenant_id, workspace_id, title,
      client_name, priority,
      status, assigned_to,
      created_by, created_at
    ) VALUES (
      ${taskId},
      ${tenantId},
      ${targetWorkspaceId},
      ${title.trim()},
      ${client_name || null},
      ${priority || 'MEDIUM'},
      'todo',
      ${assigned_to || userId},
      ${userId},
      ${now}
    )
  `);

  res.status(201).json({ success: true, id: taskId });
});

// --- Campaigns ---

export const getCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, workspaceId } = req.user as any;
  const targetWorkspaceId = workspaceId || req.query.workspaceId;

  if (!targetWorkspaceId) {
    throw new AppError('Workspace context required', 403);
  }
  
  const allCampaigns = await db.all(sql`
    SELECT DISTINCT id, name, client_name,
      status, budget, platform, created_at
    FROM campaigns 
    WHERE tenant_id = ${tenantId} 
    AND workspace_id = ${targetWorkspaceId}
    ORDER BY created_at DESC
  `);

  res.json({ success: true, campaigns: allCampaigns });
});

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { name, client_name, budget, platform } = req.body;
  const { tenantId, workspaceId, id: userId } = req.user as any;
  const targetWorkspaceId = workspaceId || req.body.workspaceId;

  if (!name || !client_name) throw new AppError('Name and Client Name are required', 400);
  if (!targetWorkspaceId) throw new AppError('Workspace context required', 400);

  const campaignId = uuidv4();
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT INTO campaigns (
      id, tenant_id, workspace_id, name, client_name,
      status, budget, platform,
      created_by, created_at
    ) VALUES (
      ${campaignId},
      ${tenantId},
      ${targetWorkspaceId},
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

export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, role, workspaceId } = req.user as any;

  // Clients only see themselves (or their assigned workspace info)
  // Admins see all clients in the tenant
  const allClients = await db.all(sql`
    SELECT * FROM clients 
    WHERE tenant_id = ${tenantId}
    ${role === 'client' ? sql`AND workspace_id = ${workspaceId}` : sql``}
    ORDER BY created_at DESC
  `);

  res.json({ success: true, clients: allClients });
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, companyName } = req.body;
  const { tenantId } = req.user as any;

  if (!name || !email) throw new AppError('Name and Email are required', 400);

  // 1. Create Workspace Automatically
  const workspaceId = uuidv4();
  const slug = (companyName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  await db.insert(workspaces).values({
    id: workspaceId,
    tenantId,
    name: companyName || name,
    slug,
  });

  // 2. Create Client record linked to workspace
  const clientId = uuidv4();
  await db.insert(clients).values({
    id: clientId,
    tenantId,
    workspaceId,
    name,
    email,
    companyName: companyName || null,
    status: 'active',
  });

  // 3. Create User record for the client
  const userId = uuidv4();
  const tempPassword = 'Client123!'; // Default password for new clients
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await db.insert(users).values({
    id: userId,
    tenantId,
    workspaceId,
    name,
    email,
    password: hashedPassword,
    role: 'client',
    provider: 'local',
  });

  res.status(201).json({ success: true, clientId, workspaceId, userId });
});
