import { Response } from 'express';
import { db } from '../db';
import { clients, campaigns, analytics, users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// --- Client Management ---
export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    
    // ROLE-BASED FILTERING
    if (req.user.role === 'team' || req.user.role === 'admin') {
      const query = sql`
        SELECT DISTINCT 
          u.id,
          u.name,
          u.email,
          COALESCE(c.status, 'ACTIVE') as status,
          u.created_at as createdAt
        FROM users u
        LEFT JOIN clients c ON c.email = u.email
        WHERE u.tenant_id = ${tenantId} 
        AND u.role = 'client'
        UNION
        SELECT 
          c.id,
          c.name,
          c.email,
          c.status,
          c.created_at as createdAt
        FROM clients c
        WHERE c.tenant_id = ${tenantId}
        ORDER BY createdAt DESC;
      `;
      const result: any = await db.all(query);
      return res.json(result);
    } else if (req.user.role === 'client') {
      const allClients = await db.query.clients.findMany({
        where: eq(clients.id, req.user.clientId || ''),
        orderBy: (clients, { desc }) => [desc(clients.createdAt)],
      });
      return res.json(allClients);
    }
  } catch (err: any) {
    console.error('[GET_CLIENTS_ERROR]', err);
    res.status(500).json({ message: 'Failed to fetch clients: ' + err.message });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[CREATE_CLIENT] Incoming payload:', req.body);
    const { name, email, companyName, status } = req.body;
    let { password } = req.body;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context missing.' });
    }

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required fields.' });
    }

    if (!password) {
      password = 'Client123!'; // Default temporary password
    }

    const clientId = uuidv4();
    const userId = uuidv4();
    const clientStatus = status || 'ACTIVE';

    // Hash the initial password for the client user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Insert into clients table first
    const clientResult = await db.insert(clients).values({
      id: clientId,
      tenantId,
      name: companyName || name,
      email,
      status: clientStatus
    }).returning() as any;

    // 2. Insert into users table
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

    console.log('[CREATE_CLIENT_SUCCESS] New client and user created:', clientId);
    res.status(201).json(clientResult[0]);
  } catch (err: any) {
    console.error('[CREATE_CLIENT_ERROR] Details:', err);
    res.status(500).json({ message: 'Database failure: ' + (err.message || 'Unknown error') });
  }
};

// --- Campaign Management ---
export const getCampaigns = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const userRole = req.user.role;
    const userClientId = req.user.clientId || req.user.client_id;
    
    const { clientId } = req.query;

    console.log('[GET_CAMPAIGNS] Context:', { tenantId, userRole, userClientId, queryClientId: clientId });

    let condition = eq(campaigns.tenantId, tenantId);
    
    // If client role, force filter by their own clientId
    if (userRole === 'client' && userClientId) {
      console.log('[GET_CAMPAIGNS] Filtering by User Client ID:', userClientId);
      condition = and(condition, eq(campaigns.clientId, userClientId)) as any;
    } else if (clientId) {
      // If admin/team, allow filtering by specific client via query
      condition = and(condition, eq(campaigns.clientId, clientId as string)) as any;
    }

    const allCampaigns = await db.selectDistinct()
      .from(campaigns)
      .where(condition)
      .orderBy(sql`${campaigns.createdAt} DESC`);

    console.log('[GET_CAMPAIGNS] Found:', allCampaigns.length);
    res.json(allCampaigns);
  } catch (err: any) {
    console.error('[GET_CAMPAIGNS_ERROR]', err);
    res.status(500).json({ message: err.message });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { name, budget, clientId, platform, startDate, endDate } = req.body;
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const userId = req.user.id || req.user.userId;

    console.log('[CREATE_CAMPAIGN] Payload:', { name, budget, clientId, tenantId });

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant context' });
    }

    // Verify client belongs to this tenant and get client name
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, clientId), eq(clients.tenantId, tenantId))
    });

    if (!client) {
      console.warn('[CREATE_CAMPAIGN] Unauthorized client access attempt:', clientId);
      return res.status(403).json({ message: 'Unauthorized: Client does not belong to your agency.' });
    }

    const campaignId = uuidv4();
    const createdAt = new Date().toISOString();

    // Use raw SQL to ensure all custom columns are populated
    await db.run(sql`
      INSERT INTO campaigns (
        id, tenant_id, client_id, client_name, name, budget, 
        status, platform, start_date, end_date, created_by, created_at
      ) VALUES (
        ${campaignId}, ${tenantId}, ${clientId}, ${client.name}, ${name}, ${budget}, 
        'ACTIVE', ${platform || 'google'}, ${startDate || null}, ${endDate || null}, ${userId}, ${createdAt}
      )
    `);

    console.log('[CREATE_CAMPAIGN_SUCCESS]', campaignId);

    res.status(201).json({
      id: campaignId,
      name,
      clientId,
      clientName: client.name,
      budget,
      status: 'ACTIVE',
      createdAt
    });
  } catch (err: any) {
    console.error('[CREATE_CAMPAIGN_ERROR]', err);
    res.status(500).json({ message: 'Failed to create campaign: ' + err.message });
  }
};

// --- Analytics ---
export const getAgencyStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;

    const [stats] = await db.select({
      totalClients: sql`count(distinct ${clients.id})`,
      totalCampaigns: sql`count(distinct ${campaigns.id})`,
      totalBudget: sql`coalesce(sum(${campaigns.budget}), 0)`,
      activeCampaigns: sql`count(case when ${campaigns.status} = 'active' then 1 end)`
    })
    .from(clients)
    .leftJoin(campaigns, eq(campaigns.clientId, clients.id))
    .where(eq(clients.tenantId, tenantId));

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
