import { Response } from 'express';
import { db } from '../db';
import { clients, campaigns, users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../utils/errors';

// --- Client Management ---

export const getClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;
  
  if (req.user.role === 'team' || req.user.role === 'admin') {
    const result = await db.all(sql`
      SELECT DISTINCT 
        u.id, u.name, u.email,
        COALESCE(c.status, 'ACTIVE') as status,
        u.created_at as createdAt
      FROM users u
      LEFT JOIN clients c ON c.email = u.email
      WHERE u.tenant_id = ${tenantId} 
      AND u.role = 'client'
      UNION
      SELECT 
        c.id, c.name, c.email, c.status,
        c.created_at as createdAt
      FROM clients c
      WHERE c.tenant_id = ${tenantId}
      ORDER BY createdAt DESC;
    `);
    return res.json(result);
  } else if (req.user.role === 'client') {
    const clientId = req.user.clientId;
    if (!clientId) throw new AppError('Client ID missing', 400);
    
    const allClients = await db.query.clients.findMany({
      where: eq(clients.id, clientId),
      orderBy: (clients, { desc }) => [desc(clients.createdAt)],
    });
    return res.json(allClients);
  }
  
  throw new AppError('Unauthorized role', 403);
});

export const createClient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, companyName, status, password } = req.body;
  const tenantId = req.user.tenantId;

  if (!name || !email) {
    throw new AppError('Name and email are required', 400);
  }

  const clientId = uuidv4();
  const userId = uuidv4();
  const clientStatus = status || 'ACTIVE';
  const tempPassword = password || 'Client123!';

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(tempPassword, salt);

  const clientResult = await db.insert(clients).values({
    id: clientId,
    tenantId,
    name: companyName || name,
    email,
    status: clientStatus
  }).returning();

  await db.insert(users).values({
    id: userId,
    tenantId,
    name,
    email,
    password: hashedPassword,
    role: 'client',
    clientId: clientId,
    provider: 'local'
  });

  res.status(201).json(clientResult[0]);
});

export const updateClient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, status } = req.body;
  const tenantId = req.user.tenantId;

  await db.update(clients)
    .set({ name, email, status })
    .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));

  await db.update(users)
    .set({ name, email })
    .where(and(eq(users.clientId, id), eq(users.tenantId, tenantId)));

  res.json({ success: true, message: 'Client updated successfully' });
});

export const deleteClient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;

  await db.delete(users)
    .where(and(eq(users.clientId, id), eq(users.tenantId, tenantId)));

  await db.delete(clients)
    .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));

  res.json({ success: true, message: 'Client deleted successfully' });
});

// --- Campaign Management ---

export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;
  const userRole = req.user.role;
  const userClientId = req.user.clientId;
  const { clientId } = req.query;

  let condition = eq(campaigns.tenantId, tenantId);
  
  if (userRole === 'client' && userClientId) {
    condition = and(condition, eq(campaigns.clientId, userClientId)) as any;
  } else if (clientId) {
    condition = and(condition, eq(campaigns.clientId, clientId as string)) as any;
  }

  const allCampaigns = await db.selectDistinct()
    .from(campaigns)
    .where(condition)
    .orderBy(sql`${campaigns.createdAt} DESC`);

  res.json(allCampaigns);
});

export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, budget, clientId, platform, startDate, endDate } = req.body;
  const tenantId = req.user.tenantId;
  const userId = req.user.id;

  if (!tenantId) throw new AppError('Missing tenant context', 400);

  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.tenantId, tenantId))
  });

  if (!client) throw new AppError('Unauthorized: Client does not belong to your agency.', 403);

  const campaignId = uuidv4();
  const createdAt = new Date().toISOString();

  await db.run(sql`
    INSERT INTO campaigns (
      id, tenant_id, client_id, client_name, name, budget, 
      status, platform, start_date, end_date, created_by, created_at
    ) VALUES (
      ${campaignId}, ${tenantId}, ${clientId}, ${client.name}, ${name}, ${budget}, 
      'ACTIVE', ${platform || 'google'}, ${startDate || null}, ${endDate || null}, ${userId}, ${createdAt}
    )
  `);

  res.status(201).json({
    id: campaignId,
    name,
    clientId,
    clientName: client.name,
    budget,
    status: 'ACTIVE',
    createdAt
  });
});

// --- Analytics ---

export const getAgencyStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user.tenantId;

  const [stats]: any = await db.select({
    totalClients: sql`count(distinct ${clients.id})`,
    totalCampaigns: sql`count(distinct ${campaigns.id})`,
    totalBudget: sql`coalesce(sum(${campaigns.budget}), 0)`,
    activeCampaigns: sql`count(case when ${campaigns.status} = 'active' then 1 end)`
  })
  .from(clients)
  .leftJoin(campaigns, eq(campaigns.clientId, clients.id))
  .where(eq(clients.tenantId, tenantId));

  res.json(stats);
});
