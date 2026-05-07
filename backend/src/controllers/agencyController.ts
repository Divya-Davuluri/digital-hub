import { Response } from 'express';
import { db } from '../db';
import { clients, campaigns, users, workspaces } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../utils/errors';

// --- Client Management with Workspace Isolation ---

export const getClients = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, workspaceId } = req.user;
  
  if (role === 'admin' || role === 'team') {
    // Admins see all clients in their agency
    const result = await db.all(sql`
      SELECT c.*, w.slug as workspace_slug
      FROM clients c
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE c.tenant_id = ${tenantId}
      ORDER BY c.created_at DESC
    `);
    return res.json(result);
  } else {
    // Clients only see their own workspace record
    const result = await db.query.clients.findMany({
      where: and(eq(clients.tenantId, tenantId), eq(clients.workspaceId, workspaceId || '')),
    });
    return res.json(result);
  }
});

export const createClient = asyncHandler(async (req: any, res: Response) => {
  const { name, email, companyName, status, password } = req.body;
  const { tenantId } = req.user;

  if (!name || !email) {
    throw new AppError('Name and email are required', 400);
  }

  // 1. Create Workspace
  const workspaceId = uuidv4();
  const slug = (companyName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  await db.insert(workspaces).values({
    id: workspaceId,
    tenantId,
    name: companyName || name,
    slug,
  });

  // 2. Create Client Record
  const clientId = uuidv4();
  await db.insert(clients).values({
    id: clientId,
    tenantId,
    workspaceId,
    name,
    email,
    companyName: companyName || null,
    status: status || 'active'
  });

  // 3. Create Client User linked to Workspace
  const userId = uuidv4();
  const tempPassword = password || 'Client123!';
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await db.insert(users).values({
    id: userId,
    tenantId,
    workspaceId,
    name,
    email,
    password: hashedPassword,
    role: 'client',
    provider: 'local'
  });

  res.status(201).json({ success: true, clientId, workspaceId, userId });
});

export const updateClient = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, email, status } = req.body;
  const { tenantId } = req.user;

  await db.update(clients)
    .set({ name, email, status })
    .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));

  res.json({ success: true, message: 'Client updated successfully' });
});

export const deleteClient = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.tenantId, tenantId))
  });

  if (!client) throw new AppError('Client not found', 404);

  // Cascade delete is handled by DB references in schema
  await db.delete(workspaces).where(eq(workspaces.id, client.workspaceId));

  res.json({ success: true, message: 'Client and workspace deleted successfully' });
});

// --- Campaign Management with Workspace Isolation ---

export const getCampaigns = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, workspaceId } = req.user;
  const targetWorkspaceId = workspaceId || req.query.workspaceId;

  if (!targetWorkspaceId && role === 'client') {
    throw new AppError('Workspace context required', 403);
  }

  let condition = eq(campaigns.tenantId, tenantId);
  if (targetWorkspaceId) {
    condition = and(condition, eq(campaigns.workspaceId, targetWorkspaceId)) as any;
  }

  const allCampaigns = await db.selectDistinct()
    .from(campaigns)
    .where(condition)
    .orderBy(sql`${campaigns.createdAt} DESC`);

  res.json(allCampaigns);
});

export const createCampaign = asyncHandler(async (req: any, res: Response) => {
  const { name, budget, workspaceId: bodyWorkspaceId, platform, startDate, endDate } = req.body;
  const { tenantId, id: userId, workspaceId: tokenWorkspaceId } = req.user;
  
  const targetWorkspaceId = tokenWorkspaceId || bodyWorkspaceId;

  if (!targetWorkspaceId) throw new AppError('Workspace ID is required', 400);

  const campaignId = uuidv4();
  const createdAt = new Date().toISOString();

  await db.run(sql`
    INSERT INTO campaigns (
      id, tenant_id, workspace_id, name, budget, 
      status, platform, start_date, end_date, created_by, created_at
    ) VALUES (
      ${campaignId}, ${tenantId}, ${targetWorkspaceId}, ${name}, ${budget}, 
      'active', ${platform || 'google'}, ${startDate || null}, ${endDate || null}, ${userId}, ${createdAt}
    )
  `);

  res.status(201).json({ success: true, id: campaignId });
});

// --- Analytics ---

export const getAgencyStats = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, workspaceId } = req.user;

  const [stats]: any = await db.select({
    totalClients: sql`count(distinct ${clients.id})`,
    totalCampaigns: sql`count(distinct ${campaigns.id})`,
    totalBudget: sql`coalesce(sum(${campaigns.budget}), 0)`,
    activeCampaigns: sql`count(case when ${campaigns.status} = 'active' then 1 end)`
  })
  .from(clients)
  .leftJoin(campaigns, eq(campaigns.workspaceId, clients.workspaceId))
  .where(role === 'client' 
    ? and(eq(clients.tenantId, tenantId), eq(clients.workspaceId, workspaceId || '')) 
    : eq(clients.tenantId, tenantId)
  );

  res.json(stats);
});
