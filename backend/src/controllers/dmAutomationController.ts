import { Request, Response } from 'express';
import { db } from '../db';
import {
  dmAutomations, dmSequences,
  workspaces, clients
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';

const safeJsonParse = (
  str: string | null, fallback: any = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
};

const formatAutomation = (a: any) => ({
  ...a,
  followUpMessages: safeJsonParse(
    a.followUpMessages, []),
  excludeKeywords: safeJsonParse(
    a.excludeKeywords, []),
  isActive: a.isActive === 1 || a.isActive === true,
  conversionRate: a.totalTriggered > 0
    ? parseFloat(
        ((a.totalConverted / a.totalTriggered) * 100)
        .toFixed(1))
    : 0,
});

const getDemoAutomations = () => ([
  {
    id: 'demo-dm-1',
    name: 'Price Inquiry Auto-Reply',
    type: 'comment_to_dm',
    triggerKeyword: 'PRICE',
    triggerCondition: 'contains',
    replyMessage: 'Hi! Thanks for your interest! 🎉 Our price starts at $99. Check out our full catalog here: [LINK]. Reply HELP for more info!',
    followUpMessages: [
      {
        day: 3,
        message: 'Hey! Did you get a chance to check our pricing? We have a special offer ending soon! 🔥'
      },
      {
        day: 7,
        message: 'Last chance! Our special pricing ends tonight. Grab yours now: [LINK] 🚀'
      }
    ],
    excludeKeywords: [],
    isActive: true,
    totalTriggered: 234,
    totalReplied: 198,
    totalConverted: 45,
    conversionRate: 19.2,
    dailyLimit: 100,
    postId: 'any',
    instagramAccountId: null,
    createdAt: new Date(
      Date.now()-10*86400000).toISOString(),
    updatedAt: new Date(
      Date.now()-1*86400000).toISOString(),
  },
  {
    id: 'demo-dm-2',
    name: 'Story Reply Welcome',
    type: 'story_reply',
    triggerKeyword: null,
    triggerCondition: 'any',
    replyMessage: 'Thanks for replying to our story! 💫 We love hearing from you. Check out our latest collection: [LINK]',
    followUpMessages: [
      {
        day: 1,
        message: 'Hope you loved our story! Here is an exclusive 10% off just for you: CODE10 🎁'
      }
    ],
    excludeKeywords: [],
    isActive: true,
    totalTriggered: 567,
    totalReplied: 543,
    totalConverted: 89,
    conversionRate: 15.7,
    dailyLimit: 200,
    postId: 'any',
    instagramAccountId: null,
    createdAt: new Date(
      Date.now()-15*86400000).toISOString(),
    updatedAt: new Date(
      Date.now()-2*86400000).toISOString(),
  },
  {
    id: 'demo-dm-3',
    name: 'Product Info Sequence',
    type: 'dm_sequence',
    triggerKeyword: 'INFO',
    triggerCondition: 'equals',
    replyMessage: 'Hi! Here is all the info you need about our product: [LINK] 📦 Any questions? Just reply!',
    followUpMessages: [
      {
        day: 2,
        message: 'Did you get a chance to check the product? Happy to answer questions! 😊'
      },
      {
        day: 5,
        message: 'Still interested? Here is a special 15% discount: SAVE15 🎁'
      },
      {
        day: 10,
        message: 'Final reminder! Your discount expires tonight. Use SAVE15 at checkout!'
      }
    ],
    excludeKeywords: ['unsubscribe', 'stop'],
    isActive: false,
    totalTriggered: 123,
    totalReplied: 115,
    totalConverted: 28,
    conversionRate: 22.8,
    dailyLimit: 50,
    postId: 'any',
    instagramAccountId: null,
    createdAt: new Date(
      Date.now()-20*86400000).toISOString(),
    updatedAt: new Date(
      Date.now()-3*86400000).toISOString(),
  },
  {
    id: 'demo-dm-4',
    name: 'Live Session Engagement',
    type: 'live_automation',
    triggerKeyword: 'SALE',
    triggerCondition: 'contains',
    replyMessage: 'Thanks for watching our live! 🎥 Here is the exclusive live-only deal: [LINK] Valid for next 2 hours only!',
    followUpMessages: [],
    excludeKeywords: [],
    isActive: true,
    totalTriggered: 89,
    totalReplied: 87,
    totalConverted: 34,
    conversionRate: 38.2,
    dailyLimit: 500,
    postId: 'any',
    instagramAccountId: null,
    createdAt: new Date(
      Date.now()-5*86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

export const createAutomation = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const {
    clientId, name, type, triggerKeyword,
    triggerCondition, replyMessage,
    followUpMessages, dailyLimit
  } = req.body;

  if (!name?.trim()) {
    throw new AppError('Automation name is required', 400);
  }
  if (!replyMessage?.trim()) {
    throw new AppError('Reply message is required', 400);
  }
  if (!type) {
    throw new AppError('Automation type is required', 400);
  }

  let workspaceId = '';
  try {
    if (clientId) {
      const ws = await db.query.workspaces.findFirst({
        where: and(
          eq(workspaces.tenantId, tenantId),
          eq(workspaces.clientId, clientId)
        )
      });
      workspaceId = ws?.id || '';
    }
    if (!workspaceId) {
      const ws = await db.query.workspaces.findFirst({
        where: eq(workspaces.tenantId, tenantId)
      });
      workspaceId = ws?.id || tenantId;
    }
  } catch (err) {
    workspaceId = tenantId;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(dmAutomations).values({
    id,
    tenantId,
    workspaceId,
    clientId: clientId || null,
    name: name.trim(),
    type,
    triggerKeyword: triggerKeyword?.trim() || null,
    triggerCondition: triggerCondition || 'contains',
    replyMessage: replyMessage.trim(),
    followUpMessages: Array.isArray(followUpMessages)
      ? JSON.stringify(followUpMessages)
      : '[]',
    isActive: 1,
    totalTriggered: 0,
    totalReplied: 0,
    totalConverted: 0,
    instagramAccountId: null,
    postId: 'any',
    excludeKeywords: '[]',
    dailyLimit: Number(dailyLimit) || 100,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.query.dmAutomations
    .findFirst({ where: eq(dmAutomations.id, id) });

  res.status(201).json({
    success: true,
    data: formatAutomation(created)
  });
});

export const getAutomations = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const all = await db
      .select()
      .from(dmAutomations)
      .where(eq(dmAutomations.tenantId, tenantId))
      .orderBy(desc(dmAutomations.createdAt));

    if (all.length === 0) {
      return res.json({
        success: true,
        data: getDemoAutomations(),
        source: 'demo'
      });
    }

    res.json({
      success: true,
      data: all.map(formatAutomation)
    });
  } catch (err) {
    console.error('[DM] getAutomations error:', err);
    res.json({
      success: true,
      data: getDemoAutomations(),
      source: 'demo'
    });
  }
});

export const updateAutomation = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const {
    name, type, triggerKeyword, triggerCondition,
    replyMessage, followUpMessages, dailyLimit
  } = req.body;

  const existing = await db.query.dmAutomations
    .findFirst({
      where: and(
        eq(dmAutomations.id, id),
        eq(dmAutomations.tenantId, tenantId)
      )
    });

  if (!existing) {
    throw new AppError('Automation not found', 404);
  }

  const updateData: any = {
    updatedAt: new Date().toISOString()
  };

  if (name !== undefined) 
    updateData.name = name;
  if (type !== undefined) 
    updateData.type = type;
  if (triggerKeyword !== undefined)
    updateData.triggerKeyword = triggerKeyword || null;
  if (triggerCondition !== undefined)
    updateData.triggerCondition = triggerCondition;
  if (replyMessage !== undefined)
    updateData.replyMessage = replyMessage;
  if (followUpMessages !== undefined)
    updateData.followUpMessages = 
      JSON.stringify(followUpMessages);
  if (dailyLimit !== undefined)
    updateData.dailyLimit = Number(dailyLimit);

  await db.update(dmAutomations)
    .set(updateData)
    .where(and(
      eq(dmAutomations.id, id),
      eq(dmAutomations.tenantId, tenantId)
    ));

  const updated = await db.query.dmAutomations
    .findFirst({ where: eq(dmAutomations.id, id) });

  res.json({
    success: true,
    data: formatAutomation(updated)
  });
});

export const toggleAutomation = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const existing = await db.query.dmAutomations
    .findFirst({
      where: and(
        eq(dmAutomations.id, id),
        eq(dmAutomations.tenantId, tenantId)
      )
    });

  if (!existing) {
    throw new AppError('Automation not found', 404);
  }

  const newStatus = existing.isActive === 1 ? 0 : 1;

  await db.update(dmAutomations)
    .set({
      isActive: newStatus,
      updatedAt: new Date().toISOString()
    })
    .where(and(
      eq(dmAutomations.id, id),
      eq(dmAutomations.tenantId, tenantId)
    ));

  res.json({
    success: true,
    isActive: newStatus === 1,
    message: newStatus === 1
      ? 'Automation activated successfully'
      : 'Automation paused successfully'
  });
});

export const deleteAutomation = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const existing = await db.query.dmAutomations
    .findFirst({
      where: and(
        eq(dmAutomations.id, id),
        eq(dmAutomations.tenantId, tenantId)
      )
    });

  if (!existing) {
    throw new AppError('Automation not found', 404);
  }

  await db.delete(dmAutomations)
    .where(and(
      eq(dmAutomations.id, id),
      eq(dmAutomations.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'Automation deleted successfully'
  });
});

export const getAutomationStats = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const all = await db
      .select()
      .from(dmAutomations)
      .where(eq(dmAutomations.tenantId, tenantId));

    if (all.length === 0) {
      return res.json({
        success: true,
        data: {
          totalAutomations: 4,
          activeAutomations: 3,
          pausedAutomations: 1,
          totalTriggered: 1013,
          totalReplied: 943,
          totalConverted: 196,
          avgConversionRate: 19.3,
          topPerforming: 'Live Session Engagement',
        },
        source: 'demo'
      });
    }

    const stats = {
      totalAutomations: all.length,
      activeAutomations: all.filter(
        a => a.isActive === 1).length,
      pausedAutomations: all.filter(
        a => a.isActive === 0).length,
      totalTriggered: all.reduce(
        (s,a) => s + (a.totalTriggered||0), 0),
      totalReplied: all.reduce(
        (s,a) => s + (a.totalReplied||0), 0),
      totalConverted: all.reduce(
        (s,a) => s + (a.totalConverted||0), 0),
      avgConversionRate: 0,
      topPerforming: all.sort(
        (a,b) => (b.totalConverted||0) -
                 (a.totalConverted||0)
      )[0]?.name || 'N/A',
    };

    stats.avgConversionRate = stats.totalTriggered > 0
      ? parseFloat(
          ((stats.totalConverted /
            stats.totalTriggered) * 100).toFixed(1))
      : 0;

    res.json({ success: true, data: stats });
  } catch (err) {
    res.json({
      success: true,
      data: {
        totalAutomations: 4,
        activeAutomations: 3,
        pausedAutomations: 1,
        totalTriggered: 1013,
        totalReplied: 943,
        totalConverted: 196,
        avgConversionRate: 19.3,
        topPerforming: 'Live Session Engagement',
      },
      source: 'demo'
    });
  }
});
