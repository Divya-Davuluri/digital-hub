import { Request, Response } from 'express';
import { db } from '../db';
import { analytics, campaigns, clients, workspaces, budgetAllocations, tenants } from '../db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { asyncHandler, AppError } from '../utils/errors';

export const getAnalyticsOverview = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role } = req.user;
  const clientId = req.query.clientId as string;
  const period = parseInt(req.query.period as string || '30', 10);
  
  // Date range logic
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

  console.log(`[Analytics] Fetching overview for Tenant: ${tenantId}, Workspace: ${workspaceId || 'ALL'}, Period: ${period} days`);

  // 1. Try to aggregate from analytics table
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

  // 2. Fallback to campaigns table if analytics is empty
  if (Number(stats.spent) === 0 && Number(stats.clicks) === 0) {
    console.log('[Analytics] No analytics rows found, falling back to campaigns aggregation');
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

    if (campaignAgg[0]) {
      stats = campaignAgg[0];
    }
  }

  // 3. Aggregate Revenue from budgetAllocations
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

  // 4. Calculate ROAS (use conversions * 150 as revenue fallback if allocations revenue is 0)
  const effectiveRevenue = totalRevenue > 0 ? totalRevenue : (totalConversions * 150);
  const avgROAS = totalSpent > 0 ? (effectiveRevenue / totalSpent).toFixed(1) : '0.0';

  console.log(`[Analytics] Final Totals -> Spent: ${totalSpent}, Revenue: ${effectiveRevenue}, Clicks: ${totalClicks}, Conv: ${totalConversions}`);

  res.json({
    success: true,
    data: {
      totalSpent,
      totalRevenue: effectiveRevenue,
      totalClicks,
      totalImpressions,
      totalConversions,
      avgROAS,
      avgRoas: avgROAS, // Support both cases
      spentChange: 15, // Demo trends
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

  // 1. Try to get daily data from analytics table
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

  // 2. Fallback to campaign creation dates if analytics is empty
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

  res.json({
    success: true,
    data
  });
});

export const exportAnalyticsPDF = asyncHandler(async (req: any, res: Response) => {
  const { metrics } = req.body;
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
