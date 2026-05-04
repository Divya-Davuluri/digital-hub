import { Response } from 'express';
import { db } from '../db';
import { campaigns, clients, tasks } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * GET /api/dashboard/summary
 * Provides aggregated KPIs across all campaigns for the tenant.
 */
export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    console.log(`📊 FETCHING DASHBOARD SUMMARY - Tenant: ${tenantId}`);

    // Aggregate Campaign KPIs
    const stats = await db
      .select({
        totalImpressions: sql<number>`sum(${campaigns.impressions})`,
        totalClicks: sql<number>`sum(${campaigns.clicks})`,
        totalSpend: sql<number>`sum(${campaigns.spend})`,
        totalConversions: sql<number>`sum(${campaigns.conversions})`,
        count: sql<number>`count(*)`,
      })
      .from(campaigns)
      .where(eq(campaigns.tenantId, tenantId));

    const data = stats[0] || { totalImpressions: 0, totalClicks: 0, totalSpend: 0, totalConversions: 0, count: 0 };
    
    // Calculate ROAS (Proxy: Conversions / Spend * 100 if spend > 0)
    const roas = data.totalSpend > 0 
      ? ((data.totalConversions * 50) / data.totalSpend).toFixed(2) // Mocking each conversion value at $50
      : "0.00";

    // Get Active Clients Count
    const clientCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.tenantId, tenantId));

    // Get Pending Tasks Count
    const taskCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.tenantId, tenantId), eq(tasks.status, 'todo')));

    res.json({
      totalImpressions: Number(data.totalImpressions || 0),
      totalClicks: Number(data.totalClicks || 0),
      totalSpend: Number(data.totalSpend || 0),
      totalConversions: Number(data.totalConversions || 0),
      avgRoas: parseFloat(roas),
      clientCount: clientCount[0].count,
      activeCampaigns: data.count,
      pendingTasks: taskCount[0].count,
    });

  } catch (error: any) {
    console.error('[DASHBOARD_SUMMARY_ERROR]', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
};

/**
 * GET /api/dashboard/stats
 * Provides time-series or channel-breakdown data for charts.
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;

    // Group by channel
    const channelStats = await db
      .select({
        channel: campaigns.channel,
        spend: sql<number>`sum(${campaigns.spend})`,
        conversions: sql<number>`sum(${campaigns.conversions})`,
      })
      .from(campaigns)
      .where(eq(campaigns.tenantId, tenantId))
      .groupBy(campaigns.channel);

    res.json(channelStats);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

