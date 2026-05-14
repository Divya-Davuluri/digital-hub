import { Request, Response } from 'express';
import { db } from '../db';
import { tenants, customDomains } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';

/**
 * GET /api/branding
 * FIX 1: Returns branding from the tenants table with exact field names for the frontend.
 */
export const getBranding = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  
  console.log('Fetching branding for tenantId:', tenantId);

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });
  
  if (!tenant) throw new AppError('Tenant not found', 404);
  
  // Return fields matching EXACTLY what frontend expects (Fix 1)
  res.json({
    agencyName: tenant.name || '',
    primaryColor: tenant.primaryColor || '#6366f1',
    secondaryColor: tenant.secondaryColor || '#4f46e5',
    logoUrl: tenant.logoUrl || '',
    faviconUrl: tenant.faviconUrl || '',
    customCss: tenant.customCss || '',
    footerText: tenant.footerText || '',
    supportEmail: tenant.supportEmail || '',
    removePoweredBy: tenant.removePoweredBy || 0,
  });
});

/**
 * POST /api/branding
 * FIX 2: Updates all branding fields directly in the tenants table.
 */
export const updateBranding = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { 
    agencyName,
    primaryColor,
    secondaryColor,
    logoUrl,
    faviconUrl,
    customCss,
    footerText,
    supportEmail,
    removePoweredBy
  } = req.body;
  
  console.log('Saving branding for tenant:', tenantId);
  console.log('Branding data received:', req.body);
  
  await db.update(tenants)
    .set({
      name: agencyName || undefined,
      primaryColor: primaryColor || undefined,
      secondaryColor: secondaryColor || undefined,
      logoUrl: logoUrl || undefined,
      faviconUrl: faviconUrl || undefined,
      customCss: customCss || undefined,
      footerText: footerText || undefined,
      supportEmail: supportEmail || undefined,
      removePoweredBy: removePoweredBy !== undefined ? Number(removePoweredBy) : undefined,
    })
    .where(eq(tenants.id, tenantId));
  
  console.log('Branding saved successfully to tenants table');
  
  res.json({ 
    success: true, 
    message: 'Branding saved successfully' 
  });
});

/**
 * GET /api/branding/domain
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
