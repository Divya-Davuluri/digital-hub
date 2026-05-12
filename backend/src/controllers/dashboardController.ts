import { Request, Response } from 'express';
import { db } from '../db';
import { campaigns, clients, tasks } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';

/**
 * GET /api/dashboard/summary
 * Provides aggregated KPIs filtered by Workspace for Multi-Tenant Isolation.
 */
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role, id: userId } = req.user as any;
    // STRICT ISOLATION: Clients strictly use their own workspaceId. Admins can query any. Team members default to their own.
    const targetWorkspaceId = role === 'client' ? workspaceId : (role === 'admin' ? (req.query.workspaceId as string) : (workspaceId || req.query.workspaceId as string));
    
    if (!tenantId) return res.status(400).json({ message: 'Tenant context missing' });
    
    // STRICT ISOLATION: Clients MUST have a workspace context
    if (role === 'client' && !targetWorkspaceId) {
      return res.status(403).json({ message: 'Unauthorized: Workspace context required' });
    }

    // Aggregate Campaign KPIs
    const stats = await db
      .select({
        totalImpressions: sql<number>`sum(${campaigns.impressions})`,
        totalClicks: sql<number>`sum(${campaigns.clicks})`,
        totalSpend: sql<number>`sum(${campaigns.spent})`,
        totalConversions: sql<number>`sum(${campaigns.conversions})`,
        count: sql<number>`count(*)`,
      })
      .from(campaigns)
      .where(targetWorkspaceId 
        ? and(eq(campaigns.tenantId, tenantId), eq(campaigns.workspaceId, targetWorkspaceId))
        : role === 'team'
        ? and(eq(campaigns.tenantId, tenantId), sql`exists (select 1 from clients where clients.workspace_id = campaigns.workspace_id and clients.assigned_team_member_id = ${userId})`)
        : eq(campaigns.tenantId, tenantId)
      );

    const data = stats[0] || { totalImpressions: 0, totalClicks: 0, totalSpend: 0, totalConversions: 0, count: 0 };
    
    const roas = data.totalSpend > 0 
      ? ((Number(data.totalConversions || 0) * 125) / Number(data.totalSpend)).toFixed(2)
      : "0.00";

    // Get Active Clients Count (Isolated to Tenant)
    const clientCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(targetWorkspaceId 
        ? and(eq(clients.tenantId, tenantId), eq(clients.workspaceId, targetWorkspaceId))
        : role === 'team'
        ? and(eq(clients.tenantId, tenantId), eq(clients.assignedTeamMemberId, userId))
        : eq(clients.tenantId, tenantId)
      );

    // Get Pending Tasks Count
    const taskCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.tenantId, tenantId),
        targetWorkspaceId 
          ? eq(tasks.workspaceId, targetWorkspaceId) 
          : role === 'team' 
            ? sql`exists (select 1 from clients where clients.workspace_id = tasks.workspace_id and clients.assigned_team_member_id = ${userId})` 
            : sql`1=1`,
        sql`status != 'COMPLETED'`
      ));

    res.json({
      totalImpressions: Number(data.totalImpressions || 0),
      totalClicks: Number(data.totalClicks || 0),
      totalSpend: Number(data.totalSpend || 0),
      totalConversions: Number(data.totalConversions || 0),
      avgRoas: parseFloat(roas),
      clientCount: clientCountRes[0]?.count || 0,
      activeCampaigns: data.count || 0,
      pendingTasks: taskCountRes[0]?.count || 0,
    });

  } catch (error: any) {
    console.error('[DASHBOARD_SUMMARY_ERROR]', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role, id: userId } = req.user as any;
    const targetWorkspaceId = role === 'client' ? workspaceId : (role === 'admin' ? (req.query.workspaceId as string) : (workspaceId || req.query.workspaceId as string));

    if (!tenantId) return res.status(400).json({ message: 'Tenant context missing' });
    if (role === 'client' && !targetWorkspaceId) {
      return res.status(403).json({ message: 'Unauthorized: Workspace context required' });
    }

    // Group by channel
    const channelStats = await db
      .select({
        channel: campaigns.channel,
        spend: sql<number>`sum(${campaigns.spend})`,
        conversions: sql<number>`sum(${campaigns.conversions})`,
      })
      .from(campaigns)
      .where(targetWorkspaceId 
        ? and(eq(campaigns.tenantId, tenantId), eq(campaigns.workspaceId, targetWorkspaceId))
        : role === 'team'
        ? and(eq(campaigns.tenantId, tenantId), sql`exists (select 1 from clients where clients.workspace_id = campaigns.workspace_id and clients.assigned_team_member_id = ${userId})`)
        : eq(campaigns.tenantId, tenantId)
      )
      .groupBy(campaigns.channel);

    res.json(channelStats);
  } catch (error: any) {
    console.error('[DASHBOARD_STATS_ERROR]', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};
