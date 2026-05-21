import { Request, Response } from 'express';
import { db } from '../db';
import {
  bioPages, shortLinks, linkClicks,
  workspaces, clients
} from '../db/schema';
import { eq, and, desc, sql as drizzleSql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';

const safeJsonParse = (str: string | null,
  fallback: any = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
};

const generateShortCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const formatBioPage = (page: any) => {
  let links = [];
  if (Array.isArray(page.links)) {
    links = page.links;
  } else {
    try {
      links = JSON.parse(page.links || '[]');
    } catch {
      links = [];
    }
  }
  return {
    ...page,
    links,
    isPublished: page.isPublished === 1 || 
                 page.isPublished === true,
  };
};

const formatShortLink = (link: any) => ({
  ...link,
  clickData: safeJsonParse(link.clickData, []),
  isActive: link.isActive === 1,
});

// BIO PAGE FUNCTIONS

export const createBioPage = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const {
    clientId, slug, title, description,
    backgroundColor, buttonStyle, buttonColor,
    links
  } = req.body;

  if (!title?.trim()) {
    throw new AppError('Title is required', 400);
  }

  const finalSlug = (slug || title)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const existing = await db.query.bioPages.findFirst({
    where: eq(bioPages.slug, finalSlug)
  });
  if (existing) {
    throw new AppError('Slug already taken', 400);
  }

  // Get workspace
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.tenantId, tenantId)
  });

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(bioPages).values({
    id,
    tenantId,
    workspaceId: ws?.id || tenantId,
    clientId: clientId || null,
    slug: finalSlug,
    title,
    description: description || null,
    logoUrl: null,
    backgroundType: 'color',
    backgroundColor: backgroundColor || '#6366f1',
    backgroundGradient: null,
    backgroundImage: null,
    fontFamily: 'Inter',
    buttonStyle: buttonStyle || 'rounded',
    buttonColor: buttonColor || '#ffffff',
    buttonTextColor: '#000000',
    links: JSON.stringify(links || []),
    totalClicks: 0,
    totalViews: 0,
    isPublished: 1,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.query.bioPages.findFirst({
    where: eq(bioPages.id, id)
  });

  res.status(201).json({
    success: true,
    data: formatBioPage(created)
  });
});

export const getBioPages = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  const pages = await db
    .select()
    .from(bioPages)
    .where(eq(bioPages.tenantId, tenantId))
    .orderBy(desc(bioPages.createdAt));

  if (pages.length === 0) {
    return res.json({
      success: true,
      data: getDemoBioPages(),
      source: 'demo'
    });
  }

  res.json({
    success: true,
    data: pages.map(formatBioPage)
  });
});

export const updateBioPage = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { 
    title, description, links, 
    backgroundColor, buttonStyle, buttonColor,
    isPublished
  } = req.body;

  const existing = await db.query.bioPages.findFirst({
    where: and(
      eq(bioPages.id, id),
      eq(bioPages.tenantId, tenantId)
    )
  });

  if (!existing) {
    throw new AppError('Bio page not found', 404);
  }

  const updateData: any = {
    updatedAt: new Date().toISOString()
  };

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (links !== undefined) updateData.links = JSON.stringify(links);
  if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
  if (buttonStyle !== undefined) updateData.buttonStyle = buttonStyle;
  if (buttonColor !== undefined) updateData.buttonColor = buttonColor;
  if (isPublished !== undefined) updateData.isPublished = isPublished ? 1 : 0;

  await db.update(bioPages)
    .set(updateData)
    .where(and(
      eq(bioPages.id, id),
      eq(bioPages.tenantId, tenantId)
    ));

  const updated = await db.query.bioPages.findFirst({
    where: eq(bioPages.id, id)
  });

  res.json({
    success: true,
    data: formatBioPage(updated)
  });
});

export const deleteBioPage = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.delete(bioPages)
    .where(and(
      eq(bioPages.id, id),
      eq(bioPages.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'Bio page deleted successfully'
  });
});

export const getBioPageBySlug = asyncHandler(
  async (req: Request, res: Response) => {
  const { slug } = req.params;

  const page = await db.query.bioPages.findFirst({
    where: eq(bioPages.slug, slug)
  });

  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Page not found'
    });
  }

  // Increment views
  await db.update(bioPages)
    .set({
      totalViews: (page.totalViews || 0) + 1,
      updatedAt: new Date().toISOString()
    })
    .where(eq(bioPages.id, page.id));

  res.json({
    success: true,
    data: formatBioPage(page)
  });
});

// SHORT LINK FUNCTIONS

export const createShortLink = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const {
    clientId, title, originalUrl,
    customAlias, campaignName,
    metaPixelId, tiktokPixelId
  } = req.body;

  if (!title?.trim() || !originalUrl?.trim()) {
    throw new AppError('Title and Original URL are required', 400);
  }

  let shortCode = '';
  if (customAlias) {
    shortCode = customAlias.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!shortCode) {
      throw new AppError('Invalid custom alias format', 400);
    }
    const existing = await db.query.shortLinks.findFirst({
      where: eq(shortLinks.shortCode, shortCode)
    });
    if (existing) {
      throw new AppError('This custom alias is already taken', 400);
    }
  } else {
    shortCode = generateShortCode();
    let existing = await db.query.shortLinks.findFirst({
      where: eq(shortLinks.shortCode, shortCode)
    });
    let attempts = 0;
    while(existing && attempts < 5) {
      shortCode = generateShortCode();
      existing = await db.query.shortLinks.findFirst({
        where: eq(shortLinks.shortCode, shortCode)
      });
      attempts++;
    }
  }

  // Get workspace
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.tenantId, tenantId)
  });

  const id = uuidv4();
  const now = new Date().toISOString();
  const appUrl = process.env.APP_URL || 'https://digital-hub-3h88.onrender.com';

  await db.insert(shortLinks).values({
    id,
    tenantId,
    workspaceId: ws?.id || tenantId,
    clientId: clientId || null,
    title,
    originalUrl,
    shortCode,
    customAlias: customAlias || null,
    campaignId: null,
    campaignName: campaignName || null,
    totalClicks: 0,
    uniqueClicks: 0,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${appUrl}/l/${shortCode}`)}`,
    isActive: 1,
    expiresAt: null,
    metaPixelId: metaPixelId || null,
    tiktokPixelId: tiktokPixelId || null,
    googleTagId: null,
    clickData: '[]',
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.query.shortLinks.findFirst({
    where: eq(shortLinks.id, id)
  });

  res.status(201).json({
    success: true,
    data: formatShortLink(created)
  });
});

export const getShortLinks = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  const links = await db
    .select()
    .from(shortLinks)
    .where(eq(shortLinks.tenantId, tenantId))
    .orderBy(desc(shortLinks.createdAt));

  if (links.length === 0) {
    return res.json({
      success: true,
      data: getDemoShortLinks(),
      source: 'demo'
    });
  }

  res.json({
    success: true,
    data: links.map(formatShortLink)
  });
});

export const deleteShortLink = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.delete(shortLinks)
    .where(and(
      eq(shortLinks.id, id),
      eq(shortLinks.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'Short link deleted successfully'
  });
});

export const trackClick = asyncHandler(
  async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  const lowerShortCode = shortCode.toLowerCase();

  const link = await db.query.shortLinks.findFirst({
    where: eq(shortLinks.shortCode, lowerShortCode)
  });

  if (!link || link.isActive !== 1) {
    return res.redirect(`${process.env.FRONTEND_URL || 'https://digital-hub-1-y60b.onrender.com'}/link-not-found`);
  }

  try {
    // Record click
    await db.insert(linkClicks).values({
      id: uuidv4(),
      linkId: link.id,
      linkType: 'short_link',
      country: null,
      city: null,
      device: req.headers['user-agent']?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop',
      browser: null,
      os: null,
      referrer: req.headers['referer'] || null,
      ipAddress: null,
      clickedAt: new Date().toISOString(),
    });

    // Increment clicks
    await db.update(shortLinks)
      .set({
        totalClicks: (link.totalClicks || 0) + 1,
        updatedAt: new Date().toISOString()
      })
      .where(eq(shortLinks.id, link.id));
  } catch (clickErr) {
    console.error('[Links] Click tracking failed:', clickErr);
  }

  return res.redirect(301, link.originalUrl);
});

export const trackClickApi = asyncHandler(
  async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  const lowerShortCode = shortCode.toLowerCase();

  const link = await db.query.shortLinks.findFirst({
    where: eq(shortLinks.shortCode, lowerShortCode)
  });

  if (!link) {
    return res.status(404).json({ success: false, message: 'not_found' });
  }

  if (link.isActive !== 1) {
    return res.status(400).json({ success: false, message: 'inactive' });
  }

  // Record click
  await db.insert(linkClicks).values({
    id: uuidv4(),
    linkId: link.id,
    linkType: 'short_link',
    country: 'Unknown',
    city: null,
    device: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
    browser: 'Unknown',
    os: 'Unknown',
    referrer: req.headers['referer'] || null,
    ipAddress: null,
    clickedAt: new Date().toISOString(),
  });

  // Increment clicks
  await db.update(shortLinks)
    .set({
      totalClicks: (link.totalClicks || 0) + 1,
      updatedAt: new Date().toISOString()
    })
    .where(eq(shortLinks.id, link.id));

  res.json({
    success: true,
    data: { originalUrl: link.originalUrl }
  });
});

export const getLinkAnalytics = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { linkId } = req.params;

  const clicks = await db.query.linkClicks.findMany({
    where: eq(linkClicks.linkId, linkId),
    orderBy: desc(linkClicks.clickedAt)
  });

  // Simple aggregation for analytics
  const clicksByDevice = clicks.reduce((acc: any, c) => {
    const dev = c.device || 'unknown';
    acc[dev] = (acc[dev] || 0) + 1;
    return acc;
  }, {});

  const clicksByCountry = clicks.reduce((acc: any, c) => {
    const country = c.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalClicks: clicks.length,
      uniqueClicks: new Set(clicks.map(c => c.ipAddress)).size,
      clicksByDevice: Object.entries(clicksByDevice).map(([device, count]) => ({ device, count })),
      clicksByCountry: Object.entries(clicksByCountry).map(([country, count]) => ({ country, count })),
      clicksByDay: [] // Simplified for now
    }
  });
});

// DEMO DATA

const getDemoBioPages = () => ([
  {
    id: 'demo-bio-1',
    slug: 'nike-marketing',
    title: 'Nike Marketing',
    description: 'Official links for Nike Marketing',
    backgroundColor: '#111827',
    buttonStyle: 'rounded',
    buttonColor: '#ffffff',
    buttonTextColor: '#000000',
    totalClicks: 1234,
    totalViews: 5678,
    isPublished: true,
    links: [
      { id:'l1', title:'🌐 Official Website',
        url:'https://nike.com', type:'website',
        clicks:456, isActive:true },
      { id:'l2', title:'📸 Instagram',
        url:'https://instagram.com/nike',
        type:'instagram', clicks:389, isActive:true },
      { id:'l3', title:'🎵 TikTok',
        url:'https://tiktok.com/@nike',
        type:'tiktok', clicks:234, isActive:true },
      { id:'l4', title:'🛍️ Shop Now',
        url:'https://nike.com/shop',
        type:'shop', clicks:155, isActive:true },
    ],
    createdAt: new Date(
      Date.now()-30*86400000).toISOString(),
  },
  {
    id: 'demo-bio-2',
    slug: 'amazon-cart',
    title: 'Amazon Cart Deals',
    description: 'Best deals and offers',
    backgroundColor: '#FF9900',
    buttonStyle: 'pill',
    buttonColor: '#232F3E',
    buttonTextColor: '#ffffff',
    totalClicks: 891,
    totalViews: 3456,
    isPublished: true,
    links: [
      { id:'l5', title:'🛒 Shop All Deals',
        url:'https://amazon.com/deals',
        type:'shop', clicks:445, isActive:true },
      { id:'l6', title:'⚡ Lightning Deals',
        url:'https://amazon.com/lightning',
        type:'website', clicks:289, isActive:true },
      { id:'l7', title:'📦 Track Order',
        url:'https://amazon.com/orders',
        type:'website', clicks:157, isActive:true },
    ],
    createdAt: new Date(
      Date.now()-20*86400000).toISOString(),
  },
]);

function getDemoShortLinks() {
  return [
    {
      id: 'demo-sl-1',
      title: 'Summer Sale Campaign',
      originalUrl: 'https://nike.com/summer-sale-2026',
      shortCode: 'summer26',
      customAlias: 'summer26',
      campaignName: 'Summer 2026',
      totalClicks: 2341,
      uniqueClicks: 1876,
      isActive: 1,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1-y60b.onrender.com/l/summer26',
      createdAt: new Date(Date.now()-15*86400000).toISOString(),
    },
    {
      id: 'demo-sl-2',
      title: 'Product Launch Link',
      originalUrl: 'https://nike.com/new-arrivals',
      shortCode: 'launch26',
      customAlias: 'launch26',
      campaignName: 'Product Launch',
      totalClicks: 1567,
      uniqueClicks: 1234,
      isActive: 1,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1-y60b.onrender.com/l/launch26',
      createdAt: new Date(Date.now()-10*86400000).toISOString(),
    },
    {
      id: 'demo-sl-3',
      title: 'Instagram Bio Link',
      originalUrl: 'https://instagram.com/nikemkt',
      shortCode: 'igbio',
      customAlias: 'igbio',
      campaignName: 'Social Media',
      totalClicks: 987,
      uniqueClicks: 756,
      isActive: 1,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1-y60b.onrender.com/l/igbio',
      createdAt: new Date(Date.now()-5*86400000).toISOString(),
    },
    {
      id: 'demo-sl-4',
      title: 'TikTok Campaign',
      originalUrl: 'https://tiktok.com/@nike/latest',
      shortCode: 'ttvid',
      customAlias: 'ttvid',
      campaignName: 'TikTok Growth',
      totalClicks: 3456,
      uniqueClicks: 2890,
      isActive: 1,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1-y60b.onrender.com/l/ttvid',
      createdAt: new Date(Date.now()-3*86400000).toISOString(),
    },
  ];
}
