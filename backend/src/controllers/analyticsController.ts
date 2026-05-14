import { Request, Response } from 'express';
import { db } from '../db';
import { analytics, campaigns, clients, workspaces, budgetAllocations, tenants } from '../db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { asyncHandler, AppError } from '../utils/errors';

// Helper function to generate mock timeseries
const generateMockTimeseries = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    return {
      date: date.toISOString().split('T')[0],
      spent: Math.floor(Math.random() * 200) + 100,
      revenue: Math.floor(Math.random() * 600) + 300,
      clicks: Math.floor(Math.random() * 80) + 20,
      impressions: Math.floor(Math.random() * 3000) + 1000,
      conversions: Math.floor(Math.random() * 8) + 1,
      roas: parseFloat((Math.random() * 2 + 2).toFixed(2))
    };
  });
};

export const getAnalyticsOverview = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;
  let periodStr = req.query.period as string;
  
  if (periodStr === 'month' || periodStr === 'lastMonth') periodStr = '30';
  const period = parseInt(periodStr || '30', 10);

  if (!clientId) throw new AppError('clientId is required', 400);

  // Get workspaceId from clientId
  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
  });

  if (!workspace) throw new AppError('Workspace not found for client', 404);

  // In a real app we'd query by date. For this demo, we'll aggregate all matching data.
  const analyticsData = await db.query.analytics.findMany({
    where: and(eq(analytics.workspaceId, workspace.id), eq(analytics.tenantId, tenantId))
  });

  const allocationsData = await db.query.budgetAllocations.findMany({
    where: eq(budgetAllocations.tenantId, tenantId)
  });

  // Calculate totals
  let totalSpent = 0;
  let totalRevenue = 0;
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalConversions = 0;
  let totalRoas = 0;

  if (analyticsData.length > 0) {
    analyticsData.forEach(item => {
      totalSpent += item.spent || 0;
      totalClicks += item.clicks || 0;
      totalImpressions += item.impressions || 0;
      totalConversions += item.conversions || 0;
      totalRoas += item.roas || 0;
    });
  } else {
    // Demo defaults if no analytics rows
    totalSpent = 6300;
    totalClicks = 2130;
    totalImpressions = 45000;
    totalConversions = 110;
  }

  if (allocationsData.length > 0) {
    allocationsData.forEach(item => {
      totalRevenue += item.revenue || 0;
    });
  } else {
    totalRevenue = 19760;
  }

  const avgROAS = totalSpent > 0 && totalRevenue > 0 ? (totalRevenue / totalSpent).toFixed(1) : (totalRoas / (analyticsData.length || 1)).toFixed(1);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const avgCVR = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';

  res.json({
    success: true,
    data: {
      totalSpent,
      totalRevenue,
      totalClicks,
      totalImpressions,
      totalConversions,
      avgROAS,
      avgCTR,
      avgCVR,
      periodLabel: `Last ${period} Days`,
      spentChange: 12,
      revenueChange: 18,
      clicksChange: 8,
      roasChange: 0.3
    }
  });
});

export const getAnalyticsTimeseries = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;
  let periodStr = req.query.period as string;
  
  if (periodStr === 'month' || periodStr === 'lastMonth') periodStr = '30';
  const period = parseInt(periodStr || '30', 10);

  if (!clientId) throw new AppError('clientId is required', 400);

  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
  });

  if (!workspace) throw new AppError('Workspace not found for client', 404);

  // For this implementation, we return mock timeseries data
  const data = generateMockTimeseries(period);

  res.json({
    success: true,
    data
  });
});

export const getChannelBreakdown = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;

  if (!clientId) throw new AppError('clientId is required', 400);

  // We could filter by workspace/pool, but for demo we just show tenant channels
  const allocations = await db.query.budgetAllocations.findMany({
    where: eq(budgetAllocations.tenantId, tenantId)
  });

  const channelColors: Record<string, string> = {
    meta: '#1877F2',
    tiktok: '#000000',
    google: '#4285F4',
    snapchat: '#FFFC00',
    pinterest: '#E60023'
  };

  let totalSpentAll = allocations.reduce((acc, curr) => acc + (curr.spentAmount || 0), 0);

  let data = allocations.map(a => {
    return {
      channel: a.channel,
      spent: a.spentAmount || 0,
      revenue: a.revenue || 0,
      clicks: a.clicks || 0,
      impressions: a.impressions || 0,
      conversions: a.conversions || 0,
      roas: a.roas || 0,
      ctr: a.ctr || 0,
      cvr: a.cvr || 0,
      share: totalSpentAll > 0 ? Math.round(((a.spentAmount || 0) / totalSpentAll) * 100) : 0,
      color: channelColors[a.channel.toLowerCase()] || '#888888'
    };
  });

  if (data.length === 0) {
    data = [
      {
        channel: 'meta',
        spent: 3100,
        revenue: 9920,
        clicks: 1242,
        impressions: 51000,
        conversions: 38,
        roas: 3.2,
        ctr: 2.43,
        cvr: 3.06,
        share: 49,
        color: '#1877F2'
      },
      {
        channel: 'tiktok',
        spent: 3200,
        revenue: 9840,
        clicks: 890,
        impressions: 23400,
        conversions: 37,
        roas: 3.1,
        ctr: 3.8,
        cvr: 4.2,
        share: 51,
        color: '#000000'
      }
    ];
  }

  res.json({
    success: true,
    data
  });
});

export const getCampaignPerformance = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const clientId = req.query.clientId as string;

  if (!clientId) throw new AppError('clientId is required', 400);

  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.clientId, clientId), eq(workspaces.tenantId, tenantId))
  });

  if (!workspace) throw new AppError('Workspace not found for client', 404);

  let campaignsList = await db.query.campaigns.findMany({
    where: and(eq(campaigns.workspaceId, workspace.id), eq(campaigns.tenantId, tenantId))
  });

  if (campaignsList.length === 0) {
    campaignsList = [
      {
        id: 'mock-camp-1',
        tenantId,
        workspaceId: workspace.id,
        name: 'Google Ads - Search Performance',
        status: 'ACTIVE',
        budget: 1500,
        spent: 840,
        clicks: 1240,
        impressions: 45000,
        conversions: 52,
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString()
      } as any
    ];
  }

  const data = campaignsList.map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    budget: c.budget,
    spent: c.spent,
    clicks: c.clicks,
    impressions: c.impressions,
    conversions: c.conversions,
    roas: c.spent > 0 ? ((c.conversions * 100) / c.spent).toFixed(1) : 3.8,
    ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 2.76,
    cvr: c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(2) : 4.19
  }));

  res.json({
    success: true,
    data
  });
});

export const exportAnalyticsPDF = asyncHandler(async (req: any, res: Response) => {
  const { clientId, period, metrics } = req.body;
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
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" class="logo" />` : `<h1 style="color:${tenant?.primaryColor || '#6366f1'}">${tenant?.name || 'Agency'}</h1>`}
        </div>
        <div class="title">Performance Report (${period} Days)</div>
      </div>
      
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-title">Total Spent</div>
          <div class="kpi-value">$${metrics?.totalSpent || 0}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Total Revenue</div>
          <div class="kpi-value">$${metrics?.totalRevenue || 0}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Total Clicks</div>
          <div class="kpi-value">${metrics?.totalClicks || 0}</div>
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
