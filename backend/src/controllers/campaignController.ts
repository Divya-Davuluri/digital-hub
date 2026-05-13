import { Request, Response } from 'express';
import { db } from '../db';
import { campaigns, adGroups, creatives, campaignActivityLogs, campaignTemplates, clients, workspaces } from '../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';

/**
 * GET /api/campaigns
 */
export const getCampaigns = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, workspaceId: userWorkspaceId, id: userId } = req.user;
  const { workspaceId: queryWorkspaceId, status, channel } = req.query;

  // STRICT ISOLATION: Admins see all unless filtered. Others see their own.
  let targetWorkspaceId = role === 'admin' ? (queryWorkspaceId as string) : (userWorkspaceId || queryWorkspaceId as string);

  let whereConditions = [eq(campaigns.tenantId, tenantId)];
  if (targetWorkspaceId) whereConditions.push(eq(campaigns.workspaceId, targetWorkspaceId));
  
  if (role === 'team' && !targetWorkspaceId) {
    whereConditions.push(sql`exists (select 1 from clients where clients.workspace_id = campaigns.workspace_id and clients.assigned_team_member_id = ${userId})`);
  }

  if (status) whereConditions.push(eq(campaigns.status, status as any));
  if (channel) whereConditions.push(eq(campaigns.channel, channel as any));

  const result = await db.query.campaigns.findMany({
    where: and(...whereConditions),
    with: {
      // Assuming relations are setup in drizzle, if not we use sql
    },
    orderBy: [sql`${campaigns.createdAt} DESC`]
  });

  // Fallback for relations if not configured in drizzle
  const enhanced = await Promise.all(result.map(async (c) => {
    const groups = await db.select().from(adGroups).where(eq(adGroups.campaignId, c.id));
    return { ...c, adGroups: groups };
  }));

  res.json({ success: true, campaigns: enhanced });
});

/**
 * POST /api/campaigns
 * Enterprise nested creation
 */
export const createCampaign = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, id: userId, workspaceId: userWorkspaceId } = req.user;
  console.log('[CAMPAIGN_CREATE_REQUEST]', { userId, role, tenantId, body: req.body });

  const { 
    name, budget, channel, platform, startDate, endDate, 
    workspaceId: bodyWorkspaceId,
    clientId: bodyClientId,
    adGroups: bodyAdGroups 
  } = req.body;

  let targetWorkspaceId = role === 'client' ? userWorkspaceId : (bodyWorkspaceId || userWorkspaceId);
  
  // Resolve workspace from clientId if provided
  if (!targetWorkspaceId && bodyClientId) {
    const clientRecord = await db.query.clients.findFirst({
      where: eq(clients.id, bodyClientId)
    });
    targetWorkspaceId = clientRecord?.workspaceId;
  }

  if (!targetWorkspaceId && role === 'admin') {
    const firstWorkspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.tenantId, tenantId)
    });
    targetWorkspaceId = firstWorkspace?.id;
  }

  if (!targetWorkspaceId) throw new AppError('Workspace context required. Please create a workspace first.', 400);

  const campaignId = uuidv4();
  const firstCreative = bodyAdGroups?.[0]?.creatives?.[0];

  // Starter Metrics (Day 8 Requirement)
  const starterBudget = Number(budget) || 0;
  const starterSpent = Math.round(starterBudget * (0.1 + Math.random() * 0.2)); // 10-30% of budget
  const starterImpressions = 10000;
  const starterClicks = 500;
  const starterConversions = 25;
  const starterCtr = (starterClicks / starterImpressions) * 100;

  try {
    // 1. Create Campaign
    await db.insert(campaigns).values({
      id: campaignId,
      tenantId,
      workspaceId: targetWorkspaceId,
      clientId: bodyClientId || null,
      name,
      budget: starterBudget,
      channel: platform || channel || 'google',
      platform: platform || 'Meta',
      startDate,
      endDate,
      status: 'ACTIVE',
      headline: firstCreative?.headline || '',
      cta: firstCreative?.callToAction || 'Learn More',
      creativeUrl: firstCreative?.url || '',
      createdBy: userId,
      spent: starterSpent,
      impressions: starterImpressions,
      clicks: starterClicks,
      conversions: starterConversions,
      ctr: starterCtr
    });

    // 2. Create Ad Groups & Creatives
    if (Array.isArray(bodyAdGroups)) {
      for (const group of bodyAdGroups) {
        const adGroupId = uuidv4();
        await db.insert(adGroups).values({
          id: adGroupId,
          campaignId,
          tenantId,
          workspaceId: targetWorkspaceId,
          name: group.name || 'Default Ad Group',
          budget: group.budget || budget || 0,
          targeting: JSON.stringify(group.targeting || {}),
          status: 'active'
        });

        if (Array.isArray(group.creatives)) {
          for (const creative of group.creatives) {
            await db.insert(creatives).values({
              id: uuidv4(),
              adGroupId,
              tenantId,
              workspaceId: targetWorkspaceId,
              name: creative.name || 'Ad Creative',
              type: creative.type || 'image',
              url: creative.url || '',
              headline: creative.headline || '',
              description: creative.description || '',
              callToAction: creative.callToAction || creative.url || 'Learn More'
            });
          }
        }
      }
    }

    // 3. Log Activity
    await db.insert(campaignActivityLogs).values({
      id: uuidv4(),
      campaignId,
      userId,
      action: 'CREATE',
      details: `Campaign "${name}" created with ${bodyAdGroups?.length || 0} ad groups.`
    });

    console.log('[CAMPAIGN_CREATE_SUCCESS]', { campaignId, name });
    res.status(201).json({ success: true, id: campaignId });
  } catch (err: any) {
    console.error('[CAMPAIGN_CREATE_ERROR]', err);
    throw new AppError(`Failed to save campaign: ${err.message}`, 500);
  }
});

/**
 * POST /api/campaigns/duplicate/:id
 */
export const duplicateCampaign = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId, id: userId } = req.user;

  const original = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId))
  });

  if (!original) throw new AppError('Original campaign not found', 404);

  const newCampaignId = uuidv4();
  
  // Clone Campaign
  await db.insert(campaigns).values({
    ...original,
    id: newCampaignId,
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString()
  });

  // Clone Ad Groups
  const groups = await db.query.adGroups.findMany({
    where: eq(adGroups.campaignId, id)
  });

  for (const group of groups) {
    const newGroupId = uuidv4();
    await db.insert(adGroups).values({
      ...group,
      id: newGroupId,
      campaignId: newCampaignId,
      createdAt: new Date().toISOString()
    });

    // Clone Creatives
    const creativeList = await db.query.creatives.findMany({
      where: eq(creatives.adGroupId, group.id)
    });

    if (creativeList.length > 0) {
      await db.insert(creatives).values(creativeList.map(c => ({
        ...c,
        id: uuidv4(),
        adGroupId: newGroupId
      })));
    }
  }

  res.json({ success: true, id: newCampaignId });
});

/**
 * PATCH /api/campaigns/bulk-status
 */
export const bulkUpdateStatus = asyncHandler(async (req: any, res: Response) => {
  const { ids, status } = req.body;
  const { tenantId } = req.user;

  if (!Array.isArray(ids) || ids.length === 0) throw new AppError('No IDs provided', 400);

  await db.update(campaigns)
    .set({ status })
    .where(and(eq(campaigns.tenantId, tenantId), inArray(campaigns.id, ids)));

  res.json({ success: true, message: `Updated ${ids.length} campaigns to ${status}` });
});

/**
 * GET /api/campaigns/templates
 */
export const getTemplates = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const templates = await db.query.campaignTemplates.findMany({
    where: eq(campaignTemplates.tenantId, tenantId)
  });
  res.json(templates);
});

/**
 * GET /api/campaigns/:id
 */
export const getCampaignById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId, role, workspaceId: userWorkspaceId } = req.user;

  const campaign = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId))
  });

  if (!campaign) throw new AppError('Campaign not found', 404);

  // STRICT ISOLATION check
  if (role !== 'admin' && campaign.workspaceId !== userWorkspaceId) {
    // If team, check assignment
    if (role === 'team') {
      const assigned = await db.query.clients.findFirst({
        where: and(
          eq(clients.workspaceId, campaign.workspaceId as string),
          eq(clients.assignedTeamMemberId, req.user.id)
        )
      });
      if (!assigned) throw new AppError('Access denied to this campaign', 403);
    } else {
      throw new AppError('Access denied', 403);
    }
  }

  // Fetch ad groups and creatives
  const groups = await db.query.adGroups.findMany({
    where: eq(adGroups.campaignId, id)
  });

  const enhancedGroups = await Promise.all(groups.map(async (g) => {
    const groupCreatives = await db.query.creatives.findMany({
      where: eq(creatives.adGroupId, g.id)
    });
    return { ...g, creatives: groupCreatives };
  }));

  // Fetch client info
  let clientInfo = null;
  if (campaign.clientId) {
    clientInfo = await db.query.clients.findFirst({
      where: eq(clients.id, campaign.clientId)
    });
  }

  res.json({ 
    success: true, 
    campaign: { 
      ...campaign, 
      adGroups: enhancedGroups,
      clientName: clientInfo?.name || 'Direct'
    } 
  });
});

/**
 * GET /api/campaigns/metrics
 */
export const getCampaignMetrics = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, workspaceId: userWorkspaceId } = req.user;
  const { workspaceId: queryWorkspaceId } = req.query;

  let targetWorkspaceId = role === 'admin' ? (queryWorkspaceId as string) : (userWorkspaceId || queryWorkspaceId as string);

  let whereConditions = [eq(campaigns.tenantId, tenantId)];
  if (targetWorkspaceId) whereConditions.push(eq(campaigns.workspaceId, targetWorkspaceId));

  const result = await db.select({
    totalSpend: sql<number>`sum(${campaigns.spent})`,
    totalImpressions: sql<number>`sum(${campaigns.impressions})`,
    totalClicks: sql<number>`sum(${campaigns.clicks})`,
    totalConversions: sql<number>`sum(${campaigns.conversions})`,
    campaignCount: sql<number>`count(${campaigns.id})`
  })
  .from(campaigns)
  .where(and(...whereConditions));

  const stats = result[0] || { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, campaignCount: 0 };

  res.json({
    success: true,
    metrics: {
      spend: Number(stats.totalSpend) || 0,
      impressions: Number(stats.totalImpressions) || 0,
      clicks: Number(stats.totalClicks) || 0,
      conversions: Number(stats.totalConversions) || 0,
      count: Number(stats.campaignCount) || 0
    }
  });
});
