import { Response } from 'express';
import { db } from '../db';
import { clients, campaigns, users, workspaces, analytics, reports, reportRequests, transactions } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../utils/errors';

// --- Client Management with Workspace Isolation ---

export const getClients = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, workspaceId } = req.user;
  
  if (role === 'admin') {
    // Admins see all clients in their agency
    const result = await db.all(sql`
      SELECT c.*, w.slug as workspace_slug, u.name as team_member_name
      FROM clients c
      LEFT JOIN workspaces w ON c.workspace_id = w.id
      LEFT JOIN users u ON c.assigned_team_member_id = u.id
      WHERE c.tenant_id = ${tenantId}
      ORDER BY c.created_at DESC
    `);
    return res.json(result);
  } else if (role === 'team') {
    // Team members only see assigned clients
    const result = await db.all(sql`
      SELECT c.*, w.slug as workspace_slug
      FROM clients c
      LEFT JOIN workspaces w ON c.workspace_id = w.id
      WHERE c.tenant_id = ${tenantId} AND c.assigned_team_member_id = ${req.user.id}
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

export const getTeamMembers = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const members = await db.query.users.findMany({
    where: and(eq(users.tenantId, tenantId), eq(users.role, 'team'))
  });
  res.json(members);
});

export const createClient = asyncHandler(async (req: any, res: Response) => {
  const { name, email, companyName, status, password, plan, assignedTeamMemberId, sendInvite } = req.body;
  const { tenantId } = req.user;

  if (!name || !email) {
    throw new AppError('Name and email are required', 400);
  }

  // Check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // 1. Create Workspace
  const workspaceId = uuidv4();
  const clientId = uuidv4();
  const slug = (companyName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  await db.insert(workspaces).values({
    id: workspaceId,
    tenantId,
    name: companyName || name,
    slug,
    status: 'active'
  });

  // 2. Create Client Record
  await db.insert(clients).values({
    id: clientId,
    tenantId,
    workspaceId,
    name,
    email,
    companyName: companyName || null,
    status: status || 'active',
    plan: plan || 'starter',
    assignedTeamMemberId: assignedTeamMemberId || null
  });

  // 3. Create Client User linked to Workspace
  const userId = uuidv4();
  const tempPassword = password || `DMH${Math.random().toString(36).substring(2, 10)}!`;
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await db.insert(users).values({
    id: userId,
    tenantId,
    workspaceId,
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'client',
    provider: 'local',
    onboardingCompleted: 0,
    status: 'active'
  });

  // 4. Seed Demo Data for the new workspace
  try {
    await seedWorkspaceDemoData(tenantId, workspaceId, clientId);
    console.log(`✅ Seeded demo data for workspace ${workspaceId}`);
  } catch (seedError) {
    console.error('⚠️ Failed to seed demo data:', seedError);
    // Don't fail the whole request if seeding fails
  }

  // 5. Handle Invitation
  let inviteSent = false;
  let inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?email=${email}`;
  
  if (sendInvite) {
    const { sendEmail } = require('../utils/email');
    const emailResult = await sendEmail({
      to: email,
      subject: `Welcome to ${companyName || 'Digital Marketing Hub'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Welcome to your Dashboard!</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your agency workspace <strong>${companyName || name}</strong> has been created.</p>
          <p>You can log in to your portal using the details below:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <a href="${inviteLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Login to Dashboard</a>
          <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Please change your password after your first login.</p>
        </div>
      `
    });
    inviteSent = emailResult.success;
  }

  res.status(201).json({ 
    success: true, 
    clientId, 
    workspaceId, 
    userId, 
    tempPassword,
    inviteSent,
    inviteLink 
  });
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
  const { tenantId, role, workspaceId: userWorkspaceId, id: userId } = req.user;
  const queryWorkspaceId = req.query.workspaceId;

  // Admins see all unless they specify a workspace. Team/Clients only see their workspace.
  let targetWorkspaceId = queryWorkspaceId;
  if (!targetWorkspaceId && role !== 'admin') {
    targetWorkspaceId = userWorkspaceId;
  }

  let condition = eq(campaigns.tenantId, tenantId);
  if (targetWorkspaceId) {
    condition = and(condition, eq(campaigns.workspaceId, targetWorkspaceId)) as any;
  }

  const allCampaigns = await db.all(sql`
    SELECT c.*, w.name as workspace_name, cl.name as client_name
    FROM campaigns c
    LEFT JOIN workspaces w ON c.workspace_id = w.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.tenant_id = ${tenantId}
    ${targetWorkspaceId ? sql`AND c.workspace_id = ${targetWorkspaceId}` : sql``}
    ${role === 'team' && !targetWorkspaceId ? sql`AND cl.assigned_team_member_id = ${userId}` : sql``}
    ORDER BY c.created_at DESC
  `);

  res.json(allCampaigns);
});

export const createCampaign = asyncHandler(async (req: any, res: Response) => {
  const { name, budget, workspaceId: bodyWorkspaceId, platform, channel, startDate, endDate } = req.body;
  const { tenantId, id: userId, workspaceId: tokenWorkspaceId } = req.user;
  
  const targetWorkspaceId = tokenWorkspaceId || bodyWorkspaceId;

  if (!targetWorkspaceId) throw new AppError('Workspace ID is required', 400);

  const campaignId = uuidv4();
  const createdAt = new Date().toISOString();

  await db.insert(campaigns).values({
    id: campaignId,
    tenantId,
    workspaceId: targetWorkspaceId,
    name,
    budget,
    status: 'active',
    channel: platform || channel || 'google',
    startDate: startDate || null,
    endDate: endDate || null,
    createdAt
  });

  res.status(201).json({ success: true, id: campaignId });
});

export const updateCampaign = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, budget, status, platform, channel, startDate, endDate } = req.body;
  const { tenantId } = req.user;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (budget !== undefined) updateData.budget = budget;
  if (status !== undefined) updateData.status = status;
  if (platform !== undefined || channel !== undefined) updateData.channel = platform || channel;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;

  if (Object.keys(updateData).length > 0) {
    await db.update(campaigns)
      .set(updateData)
      .where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)));
  }

  res.json({ success: true, message: 'Campaign updated successfully' });
});

export const deleteCampaign = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  await db.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)));

  res.json({ success: true, message: 'Campaign deleted successfully' });
});

// --- Analytics ---

export const getAgencyStats = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, id: userId } = req.user;

  // 1. Basic Stats (Clients, Campaigns, Budget)
  const [basicStats]: any = await db.select({
    totalClients: sql`count(distinct ${clients.id})`,
    totalCampaigns: sql`count(distinct ${campaigns.id})`,
    totalBudget: sql`coalesce(sum(${campaigns.budget}), 0)`,
    activeCampaigns: sql`count(case when ${campaigns.status} = 'active' then 1 end)`
  })
  .from(clients)
  .leftJoin(campaigns, eq(campaigns.workspaceId, clients.workspaceId))
  .where(role === 'team'
    ? and(eq(clients.tenantId, tenantId), eq(clients.assignedTeamMemberId, userId))
    : eq(clients.tenantId, tenantId)
  );

  // 2. Revenue & Growth Stats
  // Sum total revenue from transactions
  const totalRevenueResult = await db.select({ total: sql<number>`sum(amount)` }).from(transactions).where(eq(transactions.tenantId, tenantId));
  const totalRevenue = totalRevenueResult[0]?.total || 0;

  // Last month revenue for growth calculation (simple approximation)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const lastMonthRevenueResult = await db.select({ total: sql<number>`sum(amount)` })
    .from(transactions)
    .where(and(
      eq(transactions.tenantId, tenantId),
      sql`created_at < ${oneMonthAgo.toISOString()}`
    ));
  const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;
  
  let growth = 0;
  if (lastMonthRevenue > 0) {
    growth = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  }

  res.json({
    ...basicStats,
    totalRevenue,
    growth: growth.toFixed(1),
    clientsCount: basicStats.totalClients,
    activeCampaigns: basicStats.activeCampaigns,
    period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  });
});

export const getRecentTransactions = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;

  const result = await db.all(sql`
    SELECT t.*, w.name as clientName
    FROM transactions t
    JOIN workspaces w ON t.workspace_id = w.id
    WHERE t.tenant_id = ${tenantId}
    ORDER BY t.created_at DESC
    LIMIT 10
  `);

  res.json(result);
});

/**
 * HELPER: Seed Demo Data for new Workspaces
 */
async function seedWorkspaceDemoData(tenantId: string, workspaceId: string, clientId: string) {
  const campaign1Id = uuidv4();
  const campaign2Id = uuidv4();
  const now = new Date();

  // 1. Create Sample Campaigns
  await db.insert(campaigns).values([
    {
      id: campaign1Id,
      tenantId,
      workspaceId,
      clientId,
      name: 'Summer Growth Campaign',
      channel: 'google',
      budget: 5000,
      spent: 1240,
      impressions: 45000,
      clicks: 1200,
      conversions: 85,
      status: 'active',
      startDate: now.toISOString()
    },
    {
      id: campaign2Id,
      tenantId,
      workspaceId,
      clientId,
      name: 'Social Brand Awareness',
      channel: 'facebook',
      budget: 2500,
      spent: 850,
      impressions: 125000,
      clicks: 3400,
      conversions: 12,
      status: 'active',
      startDate: now.toISOString()
    }
  ]);

  // 2. Create Sample Analytics Summary (last 7 days)
  const analyticsData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    analyticsData.push({
      tenantId,
      workspaceId,
      campaignId: campaign1Id,
      date: d.toISOString().split('T')[0],
      clicks: Math.floor(Math.random() * 200),
      impressions: Math.floor(Math.random() * 10000),
      conversions: Math.floor(Math.random() * 20),
      spent: Math.floor(Math.random() * 500),
      totalSpent: Math.floor(Math.random() * 5000),
      roas: Math.floor(Math.random() * 10) + 2,
    });
  }
  await db.insert(analytics).values(analyticsData);

  // 3. Create Starter Report
  await db.insert(reports).values({
    id: uuidv4(),
    tenantId,
    workspaceId,
    clientId,
    campaignId: null,
    name: 'Initial Strategy & Setup Report',
    report_name: 'Initial Strategy & Setup Report',
    client_name: null,
    campaign: 'All Campaigns',
    type: 'PERFORMANCE',
    period: 'April 2026',
    startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    status: 'completed',
    totalSpend: 2090,
    impressions: 45000,
    clicks: 1240,
    conversions: 97,
    roas: 4,
    file_url: '#',
    requestedBy: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // 4. Create Starter Report Request so Client Reports page isn't empty
  await db.insert(reportRequests).values({
    id: uuidv4(),
    tenantId,
    workspaceId,
    clientId,
    reportType: 'MONTHLY_PERFORMANCE',
    dateFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: now.toISOString().split('T')[0],
    notes: 'Initial performance summary',
    status: 'COMPLETED'
  });
}
