import { Request, Response } from 'express';
import { db } from '../db';
import { analytics, campaigns, clients, workspaces, budgetAllocations, tenants } from '../db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { asyncHandler, AppError } from '../utils/errors';
import { ensureStarterData } from '../utils/seedingUtils';
import { v4 as uuidv4 } from 'uuid';

export const getAnalyticsOverview = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;
  const period = parseInt(req.query.period as string || '30', 10);
  
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - period);
  const dateStr = dateLimit.toISOString().split('T')[0];

  let workspaceId: string | null = null;
  
  if (clientId) {
    // 1. Ensure workspace exists for this client
    let workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
    });

    if (!workspace) {
      console.log(`[Analytics] No workspace found for client ${clientId}. Creating one...`);
      const newWsId = uuidv4();
      await db.insert(workspaces).values({
        id: newWsId,
        tenantId,
        clientId,
        name: 'Default Workspace',
        slug: 'default'
      });
      workspaceId = newWsId;
    } else {
      workspaceId = workspace.id;
    }

    // 2. Ensure starter data exists for this workspace
    await ensureStarterData(tenantId, workspaceId, clientId);
  }

  console.log(`[Analytics] Fetching overview for Tenant: ${tenantId}, Workspace: ${workspaceId || 'ALL'}, Period: ${period} days`);

  const whereConditions = [eq(analytics.tenantId, tenantId), gte(analytics.date, dateStr)];
  if (workspaceId) whereConditions.push(eq(analytics.workspaceId, workspaceId));

  const analyticsAgg = await db.select({
    spent: sql<number>`sum(coalesce(${analytics.spent}, 0))`,
    clicks: sql<number>`sum(coalesce(${analytics.clicks}, 0))`,
    impressions: sql<number>`sum(coalesce(${analytics.impressions}, 0))`,
    conversions: sql<number>`sum(coalesce(${analytics.conversions}, 0))`
  })
  .from(analytics)
  .where(and(...whereConditions));

  let stats = analyticsAgg[0] || { spent: 0, clicks: 0, impressions: 0, conversions: 0 };

  // Fallback to campaigns if analytics still showing 0 (unlikely after seeding but safe)
  if (Number(stats.spent) === 0 && Number(stats.clicks) === 0) {
    const campWhere = [eq(campaigns.tenantId, tenantId)];
    if (workspaceId) campWhere.push(eq(campaigns.workspaceId, workspaceId));

    const campaignAgg = await db.select({
      spent: sql<number>`sum(coalesce(${campaigns.spent}, 0))`,
      clicks: sql<number>`sum(coalesce(${campaigns.clicks}, 0))`,
      impressions: sql<number>`sum(coalesce(${campaigns.impressions}, 0))`,
      conversions: sql<number>`sum(coalesce(${campaigns.conversions}, 0))`
    })
    .from(campaigns)
    .where(and(...campWhere));

    if (campaignAgg[0]) stats = campaignAgg[0];
  }

  const revWhere = [eq(budgetAllocations.tenantId, tenantId)];
  const revenueData = await db.select({
    totalRevenue: sql<number>`sum(coalesce(${budgetAllocations.revenue}, 0))`
  })
  .from(budgetAllocations)
  .where(and(...revWhere));

  const totalSpent = Number(stats.spent || 0);
  const totalRevenue = Number(revenueData[0]?.totalRevenue || 0);
  const totalClicks = Number(stats.clicks || 0);
  const totalImpressions = Number(stats.impressions || 0);
  const totalConversions = Number(stats.conversions || 0);

  const effectiveRevenue = totalRevenue > 0 ? totalRevenue : (totalConversions * 150);
  const avgROAS = totalSpent > 0 ? (effectiveRevenue / totalSpent).toFixed(1) : '0.0';

  res.json({
    success: true,
    data: {
      totalSpent,
      totalRevenue: effectiveRevenue,
      totalClicks,
      totalImpressions,
      totalConversions,
      avgROAS,
      avgRoas: avgROAS,
      spentChange: 15,
      revenueChange: 12,
      clicksChange: 8,
      roasChange: 0.2
    }
  });
});

export const getAnalyticsTimeseries = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;
  const period = parseInt(req.query.period as string || '30', 10);

  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - period);
  const dateStr = dateLimit.toISOString().split('T')[0];

  let workspaceId: string | null = null;
  if (clientId) {
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
    });
    workspaceId = workspace?.id || null;
  }

  const whereConditions = [eq(analytics.tenantId, tenantId), gte(analytics.date, dateStr)];
  if (workspaceId) whereConditions.push(eq(analytics.workspaceId, workspaceId));

  const dailyData = await db.select({
    date: analytics.date,
    spent: sql<number>`sum(coalesce(${analytics.spent}, 0))`,
    clicks: sql<number>`sum(coalesce(${analytics.clicks}, 0))`,
    conversions: sql<number>`sum(coalesce(${analytics.conversions}, 0))`
  })
  .from(analytics)
  .where(and(...whereConditions))
  .groupBy(analytics.date)
  .orderBy(analytics.date);

  if (dailyData.length === 0) {
    const campWhere = [eq(campaigns.tenantId, tenantId), gte(campaigns.createdAt, dateStr)];
    if (workspaceId) campWhere.push(eq(campaigns.workspaceId, workspaceId));

    const fallbackData = await db.select({
      date: sql<string>`strftime('%Y-%m-%d', ${campaigns.createdAt})`,
      spent: sql<number>`sum(coalesce(${campaigns.spent}, 0))`,
      clicks: sql<number>`sum(coalesce(${campaigns.clicks}, 0))`,
      conversions: sql<number>`sum(coalesce(${campaigns.conversions}, 0))`
    })
    .from(campaigns)
    .where(and(...campWhere))
    .groupBy(sql`strftime('%Y-%m-%d', ${campaigns.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${campaigns.createdAt})`);

    return res.json({
      success: true,
      data: fallbackData.map(d => ({
        ...d,
        revenue: Number(d.conversions || 0) * 150
      }))
    });
  }

  res.json({
    success: true,
    data: dailyData.map(d => ({
      ...d,
      revenue: Number(d.conversions || 0) * 150
    }))
  });
});

export const getChannelBreakdown = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;

  let workspaceId: string | null = null;
  if (clientId) {
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
    });
    workspaceId = workspace?.id || null;
  }

  const campWhere = [eq(campaigns.tenantId, tenantId)];
  if (workspaceId) campWhere.push(eq(campaigns.workspaceId, workspaceId));

  const channelData = await db.select({
    channel: campaigns.channel,
    spent: sql<number>`sum(coalesce(${campaigns.spent}, 0))`,
    conversions: sql<number>`sum(coalesce(${campaigns.conversions}, 0))`
  })
  .from(campaigns)
  .where(and(...campWhere))
  .groupBy(campaigns.channel);

  const channelColors: Record<string, string> = {
    meta: '#1877F2', facebook: '#1877F2', tiktok: '#000000', 
    google: '#4285F4', snapchat: '#FFFC00', pinterest: '#E60023'
  };

  res.json({
    success: true,
    data: channelData.map(c => ({
      ...c,
      channel: c.channel || 'Other',
      color: channelColors[(c.channel || '').toLowerCase()] || '#888888'
    }))
  });
});

export const getCampaignPerformance = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;

  let workspaceId: string | null = null;
  if (clientId) {
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
    });
    workspaceId = workspace?.id || null;
  }

  const campWhere = [eq(campaigns.tenantId, tenantId)];
  if (workspaceId) campWhere.push(eq(campaigns.workspaceId, workspaceId));

  const campaignList = await db.query.campaigns.findMany({
    where: and(...campWhere),
    orderBy: [desc(campaigns.createdAt)]
  });

  const data = campaignList.map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    budget: c.budget,
    spent: c.spent,
    clicks: c.clicks,
    impressions: c.impressions,
    conversions: c.conversions,
    roas: Number(c.spent || 0) > 0 ? (Number(c.conversions || 0) * 150 / Number(c.spent)).toFixed(1) : '0.0',
    ctr: Number(c.impressions || 0) > 0 ? ((Number(c.clicks || 0) / Number(c.impressions)) * 100).toFixed(2) : '0.00',
    cvr: Number(c.clicks || 0) > 0 ? ((Number(c.conversions || 0) / Number(c.clicks)) * 100).toFixed(2) : '0.00'
  }));

  res.json({ success: true, data });
});

export const exportAnalyticsPDF = asyncHandler(async (req: any, res: Response) => {
  // Frontend handles PDF generation now, this remains as a lightweight fallback
  res.status(200).json({ success: true, message: "Use frontend PDF export utility." });
});
