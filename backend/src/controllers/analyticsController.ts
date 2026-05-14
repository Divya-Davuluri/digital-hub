import { Request, Response } from 'express';
import { db } from '../db';
import { analytics, campaigns, clients, workspaces, budgetAllocations, tenants } from '../db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { asyncHandler, AppError } from '../utils/errors';

export const getAnalyticsOverview = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;
  
  if (!clientId) throw new AppError('clientId is required', 400);

  // Get workspace associated with this client
  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
  });

  if (!workspace) throw new AppError('Workspace not found for client', 404);

  // 1. Fetch real campaign data from Turso
  const campaignData = await db.select({
    totalSpent: sql<number>`sum(coalesce(${campaigns.spent}, 0))`,
    totalClicks: sql<number>`sum(coalesce(${campaigns.clicks}, 0))`,
    totalImpressions: sql<number>`sum(coalesce(${campaigns.impressions}, 0))`,
    totalConversions: sql<number>`sum(coalesce(${campaigns.conversions}, 0))`
  })
  .from(campaigns)
  .where(and(eq(campaigns.workspaceId, workspace.id), eq(campaigns.tenantId, tenantId)));

  const stats = campaignData[0] || { totalSpent: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0 };

  // 2. Fetch revenue from budget allocations
  const revenueData = await db.select({
    totalRevenue: sql<number>`sum(coalesce(${budgetAllocations.revenue}, 0))`
  })
  .from(budgetAllocations)
  .where(and(eq(budgetAllocations.tenantId, tenantId)));

  const totalRevenue = Number(revenueData[0]?.totalRevenue || 0);
  const totalSpent = Number(stats.totalSpent || 0);

  // 3. Calculate Aggregates
  const avgROAS = totalSpent > 0 ? (totalRevenue / totalSpent).toFixed(1) : '0.0';
  const avgCTR = stats.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) : '0.00';
  const avgCVR = stats.totalClicks > 0 ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(2) : '0.00';

  res.json({
    success: true,
    data: {
      totalSpent,
      totalRevenue,
      totalClicks: Number(stats.totalClicks || 0),
      totalImpressions: Number(stats.totalImpressions || 0),
      totalConversions: Number(stats.totalConversions || 0),
      avgROAS,
      avgCTR,
      avgCVR,
      spentChange: 0,
      revenueChange: 0,
      clicksChange: 0,
      roasChange: 0
    }
  });
});

export const getAnalyticsTimeseries = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;

  if (!clientId) throw new AppError('clientId is required', 400);

  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  // Fetch performance over time using campaign created_at dates
  // Group by date (YYYY-MM-DD)
  const timeseries = await db.select({
    date: sql<string>`strftime('%Y-%m-%d', ${campaigns.createdAt})`,
    spent: sql<number>`sum(coalesce(${campaigns.spent}, 0))`,
    clicks: sql<number>`sum(coalesce(${campaigns.clicks}, 0))`,
    conversions: sql<number>`sum(coalesce(${campaigns.conversions}, 0))`
  })
  .from(campaigns)
  .where(and(eq(campaigns.workspaceId, workspace.id), eq(campaigns.tenantId, tenantId)))
  .groupBy(sql`strftime('%Y-%m-%d', ${campaigns.createdAt})`)
  .orderBy(sql`strftime('%Y-%m-%d', ${campaigns.createdAt})`);

  res.json({
    success: true,
    data: timeseries.map(t => ({
      ...t,
      revenue: Number(t.conversions || 0) * 150 // Mock revenue multiplier for timeseries if not available
    }))
  });
});

export const getChannelBreakdown = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;

  if (!clientId) throw new AppError('clientId is required', 400);

  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  const channelData = await db.select({
    channel: campaigns.channel,
    spent: sql<number>`sum(coalesce(${campaigns.spent}, 0))`,
    conversions: sql<number>`sum(coalesce(${campaigns.conversions}, 0))`
  })
  .from(campaigns)
  .where(and(eq(campaigns.workspaceId, workspace.id), eq(campaigns.tenantId, tenantId)))
  .groupBy(campaigns.channel);

  const channelColors: Record<string, string> = {
    meta: '#1877F2',
    facebook: '#1877F2',
    tiktok: '#000000',
    google: '#4285F4',
    snapchat: '#FFFC00',
    pinterest: '#E60023'
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

  if (!clientId) throw new AppError('clientId is required', 400);

  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  const campaignList = await db.query.campaigns.findMany({
    where: and(eq(campaigns.workspaceId, workspace.id), eq(campaigns.tenantId, tenantId)),
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

  res.json({
    success: true,
    data
  });
});

export const exportAnalyticsPDF = asyncHandler(async (req: any, res: Response) => {
  const { clientId, metrics } = req.body;
  const { tenantId } = req.user;
  
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${tenant?.primaryColor || '#6366f1'}; padding-bottom: 20px; margin-bottom: 40px; }
        .logo { max-height: 60px; }
        .title { font-size: 24px; font-weight: bold; }
        .kpis { display: flex; gap: 20px; margin-bottom: 40px; }
        .kpi { padding: 20px; background: #f8fafc; border-radius: 8px; flex: 1; }
        .kpi-title { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
        .kpi-value { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" class="logo" />` : `<h1 style="color:${tenant?.primaryColor || '#6366f1'}">${tenant?.name || 'Agency'}</h1>`}
        </div>
        <div class="title">Performance Report</div>
      </div>
      
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-title">Total Spent</div>
          <div class="kpi-value">$${Number(metrics?.totalSpent || 0).toLocaleString()}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Total Revenue</div>
          <div class="kpi-value">$${Number(metrics?.totalRevenue || 0).toLocaleString()}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Total Clicks</div>
          <div class="kpi-value">${Number(metrics?.totalClicks || 0).toLocaleString()}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Avg ROAS</div>
          <div class="kpi-value">${metrics?.avgROAS || '0.0'}x</div>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', 'attachment; filename="report.html"');
  res.send(html);
});
