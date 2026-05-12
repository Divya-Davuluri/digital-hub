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

  let targetWorkspaceId = role === 'client' ? userWorkspaceId : (queryWorkspaceId || userWorkspaceId);

  let whereConditions = [eq(campaigns.tenantId, tenantId)];
  if (targetWorkspaceId) whereConditions.push(eq(campaigns.workspaceId, targetWorkspaceId));
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

  res.json(enhanced);
});

/**
 * POST /api/campaigns
 * Enterprise nested creation
 */
export const createCampaign = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, id: userId, workspaceId: userWorkspaceId } = req.user;
  const { 
    name, budget, channel, startDate, endDate, 
    workspaceId: bodyWorkspaceId,
    adGroups: bodyAdGroups 
  } = req.body;

  const targetWorkspaceId = role === 'client' ? userWorkspaceId : (bodyWorkspaceId || userWorkspaceId);
  if (!targetWorkspaceId) throw new AppError('Workspace context required', 400);

  const campaignId = uuidv4();

  // 1. Create Campaign
  await db.insert(campaigns).values({
    id: campaignId,
    tenantId,
    workspaceId: targetWorkspaceId,
    name,
    budget,
    channel,
    startDate,
    endDate,
    status: 'active'
  });

  // 2. Create Ad Groups & Creatives if provided
  if (Array.isArray(bodyAdGroups)) {
    for (const group of bodyAdGroups) {
      const adGroupId = uuidv4();
      await db.insert(adGroups).values({
        id: adGroupId,
        campaignId,
        tenantId,
        workspaceId: targetWorkspaceId,
        name: group.name,
        budget: group.budget || 0,
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
            name: creative.name,
            type: creative.type || 'image',
            url: creative.url,
            headline: creative.headline,
            description: creative.description,
            callToAction: creative.callToAction
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

  res.status(201).json({ success: true, id: campaignId });
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
