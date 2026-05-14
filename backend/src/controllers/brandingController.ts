import { Request, Response } from 'express';
import { db } from '../db';
import { workspaces, customBranding, customDomains } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/errors';

/**
 * GET /api/branding
 * Fetches branding based on the current domain or authenticated user.
 */
export const getBranding = asyncHandler(async (req: any, res: Response) => {
  const host = req.get('host');
  const { tenantId: userTenantId } = req.user || {};
  
  let tenantId = userTenantId;

  // 1. Domain-based detection (if not authenticated or checking for white-label)
  if (!tenantId && host) {
    const domainRecord = await db.query.customDomains.findFirst({
      where: and(eq(customDomains.domain, host), eq(customDomains.status, 'active'))
    });
    if (domainRecord) tenantId = domainRecord.tenantId;
  }

  // 2. Fetch Branding
  if (!tenantId) {
    return res.json({ 
      agencyName: 'Digital Marketing Hub',
      primaryColor: '#6366f1', 
      secondaryColor: '#4f46e5',
      logoUrl: '/logo.png',
      removePoweredBy: 0
    });
  }

  const branding = await db.query.customBranding.findFirst({
    where: eq(customBranding.tenantId, tenantId),
  });

  res.json({
    agencyName: branding?.agencyName || 'Digital Marketing Hub',
    primaryColor: branding?.primaryColor || '#6366f1',
    secondaryColor: branding?.secondaryColor || '#4f46e5',
    logoUrl: branding?.logoUrl || '',
    faviconUrl: branding?.faviconUrl || '',
    customCss: branding?.customCss || '',
    removePoweredBy: branding?.removePoweredBy || 0,
    footerText: branding?.footerText || ''
  });
});

/**
 * POST /api/branding
 * Updates deep branding for the tenant.
 */
export const updateBranding = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { 
    agencyName, primaryColor, secondaryColor, logoUrl, 
    faviconUrl, customCss, supportEmail, removePoweredBy, footerText 
  } = req.body;

  const brandingData = {
    agencyName,
    primaryColor,
    secondaryColor,
    logoUrl,
    faviconUrl,
    customCss,
    supportEmail,
    removePoweredBy: Number(removePoweredBy) || 0,
    footerText,
    updatedAt: new Date().toISOString()
  };

  const existing = await db.query.customBranding.findFirst({
    where: eq(customBranding.tenantId, tenantId),
  });

  if (existing) {
    await db.update(customBranding)
      .set(brandingData)
      .where(eq(customBranding.tenantId, tenantId));
  } else {
    await db.insert(customBranding).values({
      id: uuidv4(),
      tenantId,
      ...brandingData
    });
  }

  res.json({ success: true, message: 'Branding updated successfully' });
});

/**
 * GET /api/branding/domain
 * Fetch custom domain status for the tenant.
 */
export const getDomainStatus = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const domains = await db.query.customDomains.findMany({
    where: eq(customDomains.tenantId, tenantId)
  });
  res.json(domains);
});

export const addDomain = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { domain } = req.body;

  if (!domain) throw new Error('Domain name is required');

  const id = uuidv4();
  await db.insert(customDomains).values({
    id,
    tenantId,
    domain,
    status: 'pending',
    isVerified: 0
  });

  res.json({ success: true, id });
});

export const deleteDomain = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.delete(customDomains)
    .where(and(eq(customDomains.id, id), eq(customDomains.tenantId, tenantId)));

  res.json({ success: true });
});

