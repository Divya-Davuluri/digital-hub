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
    const tenantId = req.user?.tenantId || req.user?.tenant_id || req.tenantId;
    
    if (!tenantId) {
      console.error('❌ DASHBOARD SUMMARY ERROR - No Tenant ID found');
      return res.status(400).json({ message: 'Tenant context missing' });
    }

    console.log(`📊 FETCHING DASHBOARD SUMMARY - Tenant: ${tenantId}`);

    // Aggregate Campaign KPIs using unified tenant ID
    const stats = await db
      .select({
        totalImpressions: sql<number>`sum(${campaigns.impressions})`,
        totalClicks: sql<number>`sum(${campaigns.clicks})`,
        totalSpend: sql<number>`sum(${campaigns.spend})`,
        totalConversions: sql<number>`sum(${campaigns.conversions})`,
        count: sql<number>`count(*)`,
      })
      .from(campaigns)
      .where(sql`tenant_id = ${tenantId}`);

    const data = stats[0] || { totalImpressions: 0, totalClicks: 0, totalSpend: 0, totalConversions: 0, count: 0 };
    
    // ROAS Calculation: Total Value (estimated) / Total Spend
    const roas = data.totalSpend > 0 
      ? ((Number(data.totalConversions || 0) * 125) / Number(data.totalSpend)).toFixed(2) // Valuing conversions at $125 for higher fidelity
      : "0.00";

    // Get Active Clients Count
    const clientCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(sql`tenant_id = ${tenantId}`);

    // Get Pending Tasks Count using unified status check
    const taskCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        sql`tenant_id = ${tenantId}`, 
        sql`status != 'COMPLETED'`
      ));

    const result = {
      totalImpressions: Number(data.totalImpressions || 0),
      totalClicks: Number(data.totalClicks || 0),
      totalSpend: Number(data.totalSpend || 0),
      totalConversions: Number(data.totalConversions || 0),
      avgRoas: parseFloat(roas),
      clientCount: clientCountRes[0]?.count || 0,
      activeCampaigns: data.count || 0,
      pendingTasks: taskCountRes[0]?.count || 0,
    };

    console.log(`✅ DASHBOARD SYNC COMPLETE - ${result.activeCampaigns} campaigns found`);
    res.json(result);

  } catch (error: any) {
    console.error('[DASHBOARD_SUMMARY_ERROR]', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id || req.tenantId;

    if (!tenantId) return res.status(400).json({ message: 'Tenant context missing' });

    // Group by channel using unified tenant ID
    const channelStats = await db
      .select({
        channel: campaigns.channel,
        spend: sql<number>`sum(${campaigns.spend})`,
        conversions: sql<number>`sum(${campaigns.conversions})`,
      })
      .from(campaigns)
      .where(sql`tenant_id = ${tenantId}`)
      .groupBy(campaigns.channel);

    res.json(channelStats);
  } catch (error: any) {
    console.error('[DASHBOARD_STATS_ERROR]', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

