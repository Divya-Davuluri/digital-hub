import { Response } from 'express';
import { db } from '../db';
import { clients, campaigns, analytics } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

// --- Client Management ---
export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    let condition = eq(clients.tenantId, tenantId);
    
    // ROLE-BASED FILTERING
    if (req.user.role === 'team') {
      condition = and(condition, eq(clients.assignedTo, req.user.id)) as any;
    } else if (req.user.role === 'client') {
      condition = and(condition, eq(clients.id, req.user.clientId || '')) as any;
    }

    const allClients = await db.query.clients.findMany({
      where: condition,
      orderBy: (clients, { desc }) => [desc(clients.createdAt)],
    });

    res.json(allClients);
  } catch (err: any) {
    console.error('[GET_CLIENTS_ERROR]', err);
    res.status(500).json({ message: 'Failed to fetch clients: ' + err.message });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[CREATE_CLIENT] Incoming payload:', req.body);
    const { name, email } = req.body;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      console.warn('[CREATE_CLIENT] Tenant context missing for user:', req.user.id);
      return res.status(400).json({ message: 'Tenant context missing. Agency setup required.' });
    }

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required fields.' });
    }

    const clientId = uuidv4();
    const result = await db.insert(clients).values({
      id: clientId,
      tenantId,
      name,
      email,
      status: 'active'
    }).returning() as any;

    console.log('[CREATE_CLIENT_SUCCESS] New client created:', result[0].id);
    res.status(201).json(result[0]);
  } catch (err: any) {
    console.error('[CREATE_CLIENT_ERROR] Details:', err);
    res.status(500).json({ message: 'Database failure: ' + (err.message || 'Unknown error') });
  }
};

// --- Campaign Management ---
export const getCampaigns = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { clientId } = req.query;

    let condition = eq(campaigns.tenantId, tenantId);
    if (clientId) {
      condition = and(condition, eq(campaigns.clientId, clientId as string)) as any;
    }

    const allCampaigns = await db.query.campaigns.findMany({
      where: condition,
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });

    res.json(allCampaigns);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { name, budget, clientId } = req.body;
    const tenantId = req.user.tenantId;

    console.log('[CREATE_CAMPAIGN] Payload:', { name, budget, clientId });

    // Verify client belongs to this tenant
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, clientId), eq(clients.tenantId, tenantId))
    });

    if (!client) {
      console.warn('[CREATE_CAMPAIGN] Unauthorized client access attempt:', clientId);
      return res.status(403).json({ message: 'Unauthorized: Client does not belong to your agency.' });
    }

    const newCampaign = await db.insert(campaigns).values({
      id: uuidv4(),
      tenantId,
      clientId,
      name,
      budget,
      status: 'active'
    }).returning() as any;

    res.status(201).json(newCampaign[0]);
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
