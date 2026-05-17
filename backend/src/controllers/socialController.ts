import { Request, Response } from 'express';
import { db } from '../db';
import {
  socialPosts, contentLibrary,
  workspaces, clients, users
} from '../db/schema';
import { eq, and, desc, like } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';

// Helper to parse JSON fields:
const safeJsonParse = (str: string | null, fallback: any) => {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
};

const formatPost = (post: any) => {
  if (!post) return null;
  return {
    ...post,
    platforms: safeJsonParse(post.platforms, []),
    hashtags: safeJsonParse(post.hashtags, []),
  };
};

const getDemoPosts = () => {
  const now = new Date();
  return [
    {
      id: 'demo-1',
      title: 'Summer Campaign Launch',
      content: '🌟 Summer is here! Check out our amazing deals. Limited time offer — dont miss out! #summer #deals',
      platforms: ['meta', 'instagram'],
      status: 'scheduled',
      scheduledAt: new Date(now.getTime() + 
        2*24*60*60*1000).toISOString(),
      hashtags: ['#summer','#deals','#limitedoffer'],
      mediaType: 'image',
      clientId: null,
    },
    {
      id: 'demo-2',
      title: 'Product Feature Highlight',
      content: '✨ Discover our latest feature that saves you hours every week. Try it today!',
      platforms: ['tiktok', 'linkedin'],
      status: 'pending',
      scheduledAt: new Date(now.getTime() + 
        4*24*60*60*1000).toISOString(),
      hashtags: ['#productivity','#tech','#saas'],
      mediaType: 'video',
      clientId: null,
    },
    {
      id: 'demo-3',
      title: 'Client Success Story',
      content: '💪 See how our client achieved 3x ROAS in just 30 days using our platform!',
      platforms: ['linkedin', 'meta'],
      status: 'approved',
      scheduledAt: new Date(now.getTime() + 
        6*24*60*60*1000).toISOString(),
      hashtags: ['#success','#casestudy','#marketing'],
      mediaType: 'image',
      clientId: null,
    },
    {
      id: 'demo-4',
      title: 'Weekend Engagement Post',
      content: '🎉 What are your weekend plans? Share below! #weekend #community',
      platforms: ['meta', 'instagram', 'tiktok'],
      status: 'draft',
      scheduledAt: new Date(now.getTime() + 
        8*24*60*60*1000).toISOString(),
      hashtags: ['#weekend','#community','#engagement'],
      mediaType: 'text',
      clientId: null,
    },
    {
      id: 'demo-5',
      title: 'Industry Tips Thread',
      content: '📊 5 marketing tips that will transform your ROI in 2026. Thread 🧵',
      platforms: ['linkedin', 'meta'],
      status: 'published',
      scheduledAt: new Date(now.getTime() - 
        2*24*60*60*1000).toISOString(),
      publishedAt: new Date(now.getTime() - 
        2*24*60*60*1000).toISOString(),
      hashtags: ['#marketing','#tips','#roi'],
      mediaType: 'text',
      clientId: null,
    },
  ];
};

const getDemoLibrary = () => ([
  {
    id: 'lib-1',
    name: 'Summer Sale Template',
    type: 'template',
    content: '🌟 Summer Sale is here! Get [X]% off on all products. Use code SUMMER[YEAR]. Shop now → [LINK] #summer #sale #deals',
    tags: ['sale','summer','discount'],
    usageCount: 12,
  },
  {
    id: 'lib-2',
    name: 'Product Launch Template',
    type: 'template',
    content: '🚀 Exciting news! We just launched [PRODUCT NAME]. Here is what makes it special: ✅ [Feature 1] ✅ [Feature 2] ✅ [Feature 3] Try it today → [LINK]',
    tags: ['launch','product','new'],
    usageCount: 8,
  },
  {
    id: 'lib-3',
    name: 'Engagement Question',
    type: 'caption',
    content: '💬 Quick question for our community: [QUESTION]? Drop your answer below! 👇 We read every comment.',
    tags: ['engagement','community','question'],
    usageCount: 23,
  },
  {
    id: 'lib-4',
    name: 'Marketing Hashtag Set',
    type: 'hashtag_set',
    content: '#digitalmarketing #marketing #socialmedia #contentmarketing #seo #branding #marketingstrategy #business #entrepreneur #growthhacking',
    tags: ['marketing','general'],
    usageCount: 45,
  },
  {
    id: 'lib-5',
    name: 'Client Testimonial Template',
    type: 'template',
    content: '⭐ "[CLIENT QUOTE]" - [CLIENT NAME], [CLIENT COMPANY] We love hearing from our amazing clients! Ready to achieve similar results? DM us today.',
    tags: ['testimonial','social proof','trust'],
    usageCount: 6,
  },
]);

export const createPost = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const {
    clientId, title, content, platforms,
    scheduledAt, mediaUrl, mediaType,
    hashtags, firstComment, status
  } = req.body;

  // Find workspace for client
  const workspace = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.tenantId, tenantId),
      clientId ? eq(workspaces.clientId, clientId) : undefined
    )
  });

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const platformsJson = Array.isArray(platforms)
    ? JSON.stringify(platforms)
    : platforms;

  const postId = uuidv4();
  await db.insert(socialPosts).values({
    id: postId,
    tenantId,
    workspaceId: workspace.id,
    clientId: clientId || null,
    title,
    content,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || 'text',
    platforms: platformsJson,
    scheduledAt: scheduledAt || null,
    publishedAt: null,
    status: status || 'draft',
    approvedBy: null,
    rejectedReason: null,
    hashtags: hashtags ? JSON.stringify(hashtags) : null,
    firstComment: firstComment || null,
    bestTimeScore: 0,
    createdBy: req.user.id || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const created = await db.query.socialPosts.findFirst({
    where: eq(socialPosts.id, postId)
  });

  res.status(201).json({
    success: true,
    data: formatPost(created)
  });
});

export const getPosts = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const allPosts = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.tenantId, tenantId))
      .orderBy(desc(socialPosts.createdAt));

    const formatted = allPosts.map(post => ({
      ...post,
      platforms: (() => {
        if (Array.isArray(post.platforms)) 
          return post.platforms;
        try { return JSON.parse(post.platforms||'[]'); }
        catch { return []; }
      })(),
      hashtags: (() => {
        if (Array.isArray(post.hashtags)) 
          return post.hashtags;
        try { return JSON.parse(post.hashtags||'[]'); }
        catch { return []; }
      })(),
    }));

    if (formatted.length === 0) {
      return res.json({
        success: true,
        data: getSocialDemoPosts(),
        source: 'demo'
      });
    }

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('[Social] getPosts failed:', err);
    res.json({
      success: true,
      data: getSocialDemoPosts(),
      source: 'demo'
    });
  }
});

export const updatePost = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const updateData = req.body;

  if (updateData.platforms && Array.isArray(updateData.platforms)) {
    updateData.platforms = JSON.stringify(updateData.platforms);
  }
  if (updateData.hashtags && Array.isArray(updateData.hashtags)) {
    updateData.hashtags = JSON.stringify(updateData.hashtags);
  }

  await db.update(socialPosts)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(and(
      eq(socialPosts.id, id),
      eq(socialPosts.tenantId, tenantId)
    ));

  const updated = await db.query.socialPosts.findFirst({
    where: eq(socialPosts.id, id)
  });

  res.json({ success: true, data: formatPost(updated) });
});

export const deletePost = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.delete(socialPosts)
    .where(and(
      eq(socialPosts.id, id),
      eq(socialPosts.tenantId, tenantId)
    ));

  res.json({ success: true, message: 'Post deleted' });
});

export const approvePost = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.update(socialPosts)
    .set({
      status: 'approved',
      approvedBy: req.user.id,
      updatedAt: new Date().toISOString(),
    })
    .where(and(
      eq(socialPosts.id, id),
      eq(socialPosts.tenantId, tenantId)
    ));

  res.json({ success: true, message: 'Post approved successfully' });
});

export const rejectPost = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { reason } = req.body;

  await db.update(socialPosts)
    .set({
      status: 'rejected',
      rejectedReason: reason || 'No reason provided',
      updatedAt: new Date().toISOString(),
    })
    .where(and(
      eq(socialPosts.id, id),
      eq(socialPosts.tenantId, tenantId)
    ));

  res.json({ success: true, message: 'Post rejected' });
});

export const getBestTimes = asyncHandler(async (req: any, res: Response) => {
  const bestTimes: Record<string, any[]> = {
    meta: [
      { day:'Wednesday', time:'11:00', score:9.2, label:'Best' },
      { day:'Friday',    time:'13:00', score:8.8, label:'Great' },
      { day:'Tuesday',   time:'09:00', score:8.5, label:'Good' },
      { day:'Thursday',  time:'14:00', score:8.2, label:'Good' },
    ],
    tiktok: [
      { day:'Tuesday',   time:'19:00', score:9.5, label:'Best' },
      { day:'Thursday',  time:'20:00', score:9.1, label:'Great' },
      { day:'Friday',    time:'18:00', score:8.9, label:'Great' },
      { day:'Saturday',  time:'11:00', score:8.6, label:'Good' },
    ],
    linkedin: [
      { day:'Tuesday',   time:'08:00', score:9.3, label:'Best' },
      { day:'Wednesday', time:'10:00', score:9.0, label:'Great' },
      { day:'Thursday',  time:'09:00', score:8.7, label:'Great' },
      { day:'Monday',    time:'07:00', score:8.4, label:'Good' },
    ],
    instagram: [
      { day:'Monday',    time:'11:00', score:9.1, label:'Best' },
      { day:'Wednesday', time:'14:00', score:8.9, label:'Great' },
      { day:'Friday',    time:'10:00', score:8.6, label:'Good' },
      { day:'Sunday',    time:'17:00', score:8.3, label:'Good' },
    ],
    youtube: [
      { day:'Friday',    time:'15:00', score:9.0, label:'Best' },
      { day:'Saturday',  time:'11:00', score:8.8, label:'Great' },
      { day:'Sunday',    time:'12:00', score:8.5, label:'Good' },
    ],
  };

  const platform = req.query.platform as string || 'meta';
  res.json({
    success: true,
    data: bestTimes[platform.toLowerCase()] || bestTimes.meta
  });
});

export const getContentLibrary = asyncHandler(async (req: any, res: Response) => {
  try {
    const { tenantId } = req.user;

    const items = await db
      .select()
      .from(contentLibrary)
      .where(eq(contentLibrary.tenantId, tenantId))
      .orderBy(desc(contentLibrary.usageCount));

    if (items.length === 0) {
      return res.json({
        success: true,
        data: getDemoLibrary(),
        source: 'demo'
      });
    }
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('getContentLibrary error:', error);
    res.json({ success: true, data: getDemoLibrary(), source: 'error-fallback' });
  }
});

export const addToLibrary = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { name, type, content, tags } = req.body;

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.tenantId, tenantId)
  });

  const itemId = uuidv4();
  await db.insert(contentLibrary).values({
    id: itemId,
    tenantId,
    workspaceId: ws?.id || tenantId,
    name,
    type: type || 'template',
    content: content || null,
    mediaUrl: null,
    tags: tags ? JSON.stringify(tags) : null,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true });
});

const getSocialDemoPosts = () => {
  const now = new Date();
  return [
    {
      id:'sp-1', title:'Summer Campaign Launch',
      content:'🌟 Summer is here! Check out our amazing deals.',
      platforms:['meta','instagram'],
      status:'scheduled',
      scheduledAt: new Date(now.getTime()+
        2*86400000).toISOString(),
      hashtags:['#summer','#deals'],
      mediaType:'image',
    },
    {
      id:'sp-2', title:'Product Feature Highlight',
      content:'✨ Discover our latest feature!',
      platforms:['tiktok','linkedin'],
      status:'pending',
      scheduledAt: new Date(now.getTime()+
        4*86400000).toISOString(),
      hashtags:['#product','#launch'],
      mediaType:'video',
    },
    {
      id:'sp-3', title:'Client Success Story',
      content:'💪 3x ROAS in 30 days!',
      platforms:['linkedin','meta'],
      status:'approved',
      scheduledAt: new Date(now.getTime()+
        6*86400000).toISOString(),
      hashtags:['#success','#results'],
      mediaType:'image',
    },
    {
      id:'sp-4', title:'Weekend Engagement',
      content:'🎉 Happy weekend everyone!',
      platforms:['meta','instagram','tiktok'],
      status:'draft',
      scheduledAt: new Date(now.getTime()+
        8*86400000).toISOString(),
      hashtags:['#weekend'],
      mediaType:'text',
    },
    {
      id:'sp-5', title:'Industry Tips',
      content:'📊 5 marketing tips for better ROI',
      platforms:['linkedin'],
      status:'published',
      scheduledAt: new Date(now.getTime()-
        2*86400000).toISOString(),
      publishedAt: new Date(now.getTime()-
        2*86400000).toISOString(),
      hashtags:['#tips','#marketing'],
      mediaType:'text',
    },
  ];
};
