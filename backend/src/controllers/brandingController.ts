import { Request, Response } from 'express';
import { db } from '../db';
import { tenants, customDomains, tenantBranding } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/branding
 * FIX: Returns branding from tenant_branding table with fallback.
 */
export const getBranding = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    // Check tenant_branding table first
    const branding = await db.query.tenantBranding
      .findFirst({
        where: eq(tenantBranding.tenantId, tenantId)
      });

    if (branding) {
      return res.json({
        agencyName:        branding.agencyName        || '',
        primaryColor:      branding.primaryColor      || '#6366f1',
        secondaryColor:    branding.secondaryColor    || '#4f46e5',
        logoUrl:           branding.logoUrl           || '',
        faviconUrl:        branding.faviconUrl        || '',
        customCss:         branding.customCss         || '',
        footerText:        branding.footerText        || '',
        supportEmail:      branding.supportEmail      || '',
        removePoweredBy:   branding.removePoweredBy   || 0,
        sidebarBg:         (branding as any).sidebarBg || '#1e293b',
        cardBg:            (branding as any).cardBg    || '#ffffff',
        sidebarTheme:      (branding as any).sidebarTheme || 'dark',
        loginPageBranding: (branding as any).loginPageBranding || 'center',
      });
    }

    // Fallback to tenants table
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });

    return res.json({
      agencyName:        tenant?.name || '',
      primaryColor:      '#6366f1',
      secondaryColor:    '#4f46e5',
      logoUrl:           '',
      faviconUrl:        '',
      customCss:         '',
      footerText:        '',
      supportEmail:      '',
      removePoweredBy:   0,
      sidebarBg:         '#1e293b',
      cardBg:            '#ffffff',
      sidebarTheme:      'dark',
      loginPageBranding: 'center',
    });
  } catch (err) {
    console.error('[Branding] GET failed:', err);
    return res.json({
      agencyName:        '',
      primaryColor:      '#6366f1',
      secondaryColor:    '#4f46e5',
      logoUrl:           '',
      faviconUrl:        '',
      customCss:         '',
      footerText:        '',
      supportEmail:      '',
      removePoweredBy:   0,
      sidebarBg:         '#1e293b',
      cardBg:            '#ffffff',
      sidebarTheme:      'dark',
      loginPageBranding: 'center',
    });
  }
});

export const updateBranding = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const {
    agencyName, primaryColor, secondaryColor,
    logoUrl, faviconUrl, customCss,
    footerText, supportEmail, removePoweredBy,
    sidebarBg, cardBg, sidebarTheme, loginPageBranding
  } = req.body;

  const now = new Date().toISOString();

  try {
    const existing = await db.query.tenantBranding
      .findFirst({
        where: eq(tenantBranding.tenantId, tenantId)
      });

    if (existing) {
      await db.update(tenantBranding)
        .set({
          agencyName:        agencyName ?? 
                             existing.agencyName,
          primaryColor:      primaryColor ?? 
                             existing.primaryColor,
          secondaryColor:    secondaryColor ?? 
                             existing.secondaryColor,
          logoUrl:           logoUrl !== undefined
                             ? logoUrl : existing.logoUrl,
          faviconUrl:        faviconUrl !== undefined
                             ? faviconUrl 
                             : existing.faviconUrl,
          customCss:         customCss ?? existing.customCss,
          footerText:        footerText ?? 
                             existing.footerText,
          supportEmail:      supportEmail ?? 
                             existing.supportEmail,
          removePoweredBy:   removePoweredBy ?? 
                             existing.removePoweredBy,
          sidebarBg:         sidebarBg ?? (existing as any).sidebarBg,
          cardBg:            cardBg ?? (existing as any).cardBg,
          sidebarTheme:      sidebarTheme ?? (existing as any).sidebarTheme,
          loginPageBranding: loginPageBranding ?? (existing as any).loginPageBranding,
          updatedAt: now,
        })
        .where(eq(tenantBranding.tenantId, tenantId));
    } else {
      await db.insert(tenantBranding).values({
        id: uuidv4(),
        tenantId,
        agencyName:        agencyName      || '',
        primaryColor:      primaryColor    || '#6366f1',
        secondaryColor:    secondaryColor  || '#4f46e5',
        logoUrl:           logoUrl         || '',
        faviconUrl:        faviconUrl      || '',
        customCss:         customCss       || '',
        footerText:        footerText      || '',
        supportEmail:      supportEmail    || '',
        removePoweredBy:   removePoweredBy || 0,
        sidebarBg:         sidebarBg       || '#1e293b',
        cardBg:            cardBg          || '#ffffff',
        sidebarTheme:      sidebarTheme    || 'dark',
        loginPageBranding: loginPageBranding || 'center',
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    res.json({ success: true, 
      message: 'Branding saved!' });
  } catch (err) {
    console.error('[Branding] POST failed:', err);
    throw new AppError('Failed to save branding', 500);
  }
});

/**
 * POST /api/branding/upload
 * FIX 3: Uploads branding asset to Cloudinary.
 */
export const uploadBrandingAsset = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  console.log('Uploading asset to Cloudinary for tenant:', req.user.tenantId);

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'branding', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(req.file.buffer);
  });

  console.log('Asset uploaded successfully:', (result as any).secure_url);

  res.json({ 
    success: true, 
    url: (result as any).secure_url 
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
