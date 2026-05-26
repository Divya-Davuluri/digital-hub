import { Request, Response } from 'express';
import { db } from '../db';
import { tenants, customDomains, agencyBranding, workspaces } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/settings/branding (or /api/branding)
 * Returns branding from agency_branding table with fallback.
 */
export const getBranding = asyncHandler(
  async (req: any, res: Response) => {
  let tenantId = req.user?.tenantId;
  let workspaceId = req.user?.workspaceId;

  // Try manually parsing JWT token if req.user is not populated (public GET routes)
  if (!tenantId) {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.token;
    let token = tokenFromCookie;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (token) {
      try {
        const decoded: any = jwt.verify(token, config.jwtSecret);
        tenantId = decoded.tenantId;
        workspaceId = decoded.workspaceId;
      } catch (err) {
        // Ignore token error and continue to fallbacks
      }
    }
  }

  // Fallback to tenantMiddleware detection
  if (!tenantId) {
    tenantId = req.tenantId;
  }

  // Fallback to headers or query params
  if (!tenantId) {
    tenantId = req.query.tenantId || req.headers['x-tenant-id'];
  }

  if (!workspaceId) {
    workspaceId = req.query.workspaceId || req.headers['x-workspace-id'];
  }

  // Final database-backed fallbacks
  if (!tenantId) {
    const firstTenant = await db.query.tenants.findFirst();
    tenantId = firstTenant?.id || 'default-tenant';
  }

  if (!workspaceId || workspaceId === 'default-workspace') {
    const firstWorkspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.tenantId, tenantId)
    });
    workspaceId = firstWorkspace?.id || 'default-workspace';
  }

  try {
    // Check agency_branding table first
    let branding = await db.query.agencyBranding.findFirst({
      where: and(
        eq(agencyBranding.tenantId, tenantId),
        eq(agencyBranding.workspaceId, workspaceId)
      )
    });

    if (!branding) {
      branding = await db.query.agencyBranding.findFirst({
        where: eq(agencyBranding.tenantId, tenantId)
      });
    }

    if (branding) {
      return res.json({
        agencyName:        branding.agencyName        || '',
        primaryColor:      branding.primaryColor      || '#6366f1',
        secondaryColor:    branding.secondaryColor    || '#4f46e5',
        logoUrl:           branding.logoUrl           || '',
        faviconUrl:        branding.faviconUrl        || '',
        customCss:         branding.customCss         || '',
        footerText:        '',
        supportEmail:      branding.supportEmail      || '',
        removePoweredBy:   branding.removePoweredBy   || 0,
        sidebarBg:         '#1e293b',
        cardBg:            '#ffffff',
        sidebarTheme:      branding.themeMode         || 'dark',
        loginPageBranding: branding.layoutMode        || 'center',
        customDomain:      branding.customDomain      || '',
      });
    }

    // Fallback to tenants table
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });

    return res.json({
      agencyName:        tenant?.name || 'Digital Hub',
      primaryColor:      tenant?.primaryColor || '#6366f1',
      secondaryColor:    tenant?.secondaryColor || '#4f46e5',
      logoUrl:           tenant?.logoUrl || '',
      faviconUrl:        tenant?.faviconUrl || '',
      customCss:         tenant?.customCss || '',
      footerText:        tenant?.footerText || '',
      supportEmail:      tenant?.supportEmail || '',
      removePoweredBy:   tenant?.removePoweredBy || 0,
      sidebarBg:         '#1e293b',
      cardBg:            '#ffffff',
      sidebarTheme:      'dark',
      loginPageBranding: 'center',
      customDomain:      tenant?.customDomain || '',
    });
  } catch (err) {
    console.error('[Branding] GET failed:', err);
    return res.json({
      agencyName:        'Digital Hub',
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
      customDomain:      '',
    });
  }
});

/**
 * PUT /api/settings/branding (or POST /api/branding)
 * Saves agency branding.
 */
export const updateBranding = asyncHandler(
  async (req: any, res: Response) => {
  const tenantId = req.user?.tenantId || req.tenantId || req.body.tenantId || 'default-tenant';
  const workspaceId = req.user?.workspaceId || req.body.workspaceId || req.query.workspaceId || 'default-workspace';
  const {
    agencyName, primaryColor, secondaryColor,
    logoUrl, faviconUrl, customCss,
    supportEmail, removePoweredBy,
    sidebarTheme, loginPageBranding, customDomain
  } = req.body;

  // Validate input
  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    throw new AppError('Invalid support email address', 400);
  }

  const now = new Date().toISOString();

  try {
    let existing = await db.query.agencyBranding.findFirst({
      where: and(
        eq(agencyBranding.tenantId, tenantId),
        eq(agencyBranding.workspaceId, workspaceId)
      )
    });

    const updatedData = {
      agencyName:        agencyName !== undefined ? agencyName : (existing?.agencyName ?? ''),
      primaryColor:      primaryColor !== undefined ? primaryColor : (existing?.primaryColor ?? '#6366f1'),
      secondaryColor:    secondaryColor !== undefined ? secondaryColor : (existing?.secondaryColor ?? '#4f46e5'),
      logoUrl:           logoUrl !== undefined ? logoUrl : (existing?.logoUrl ?? ''),
      faviconUrl:        faviconUrl !== undefined ? faviconUrl : (existing?.faviconUrl ?? ''),
      customCss:         customCss !== undefined ? customCss : (existing?.customCss ?? ''),
      supportEmail:      supportEmail !== undefined ? supportEmail : (existing?.supportEmail ?? ''),
      removePoweredBy:   removePoweredBy !== undefined ? removePoweredBy : (existing?.removePoweredBy ?? 0),
      themeMode:         sidebarTheme !== undefined ? sidebarTheme : (existing?.themeMode ?? 'dark'),
      layoutMode:        loginPageBranding !== undefined ? loginPageBranding : (existing?.layoutMode ?? 'center'),
      customDomain:      customDomain !== undefined ? customDomain : (existing?.customDomain ?? ''),
      updatedAt:         now,
    };

    if (existing) {
      await db.update(agencyBranding)
        .set(updatedData)
        .where(eq(agencyBranding.id, existing.id));
    } else {
      const newId = uuidv4();
      await db.insert(agencyBranding).values({
        id: newId,
        tenantId,
        workspaceId,
        ...updatedData,
        createdAt: now,
      });
    }

    // Keep tenants table branding properties in sync as fallback
    await db.update(tenants)
      .set({
        name: updatedData.agencyName,
        primaryColor: updatedData.primaryColor,
        secondaryColor: updatedData.secondaryColor,
        logoUrl: updatedData.logoUrl,
        faviconUrl: updatedData.faviconUrl,
        supportEmail: updatedData.supportEmail,
        customCss: updatedData.customCss,
        removePoweredBy: updatedData.removePoweredBy,
        customDomain: updatedData.customDomain || null,
      })
      .where(eq(tenants.id, tenantId));

    const finalBranding = await db.query.agencyBranding.findFirst({
      where: and(
        eq(agencyBranding.tenantId, tenantId),
        eq(agencyBranding.workspaceId, workspaceId)
      )
    });

    res.json({
      success: true,
      message: 'Branding saved successfully!',
      branding: {
        agencyName:        finalBranding?.agencyName        || '',
        primaryColor:      finalBranding?.primaryColor      || '#6366f1',
        secondaryColor:    finalBranding?.secondaryColor    || '#4f46e5',
        logoUrl:           finalBranding?.logoUrl           || '',
        faviconUrl:        finalBranding?.faviconUrl        || '',
        customCss:         finalBranding?.customCss         || '',
        supportEmail:      finalBranding?.supportEmail      || '',
        removePoweredBy:   finalBranding?.removePoweredBy   || 0,
        sidebarTheme:      finalBranding?.themeMode         || 'dark',
        loginPageBranding: finalBranding?.layoutMode        || 'center',
        customDomain:      finalBranding?.customDomain      || '',
      }
    });
  } catch (err) {
    console.error('[Branding] POST/PUT failed:', err);
    throw new AppError('Failed to save branding', 500);
  }
});

/**
 * POST /api/branding/upload
 * Uploads branding asset to Cloudinary, fallback to local storage.
 */
export const uploadBrandingAsset = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                        process.env.CLOUDINARY_API_KEY && 
                        process.env.CLOUDINARY_API_SECRET;

  if (hasCloudinary) {
    console.log('Uploading asset to Cloudinary for tenant:', req.user.tenantId);
    try {
      const result: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'branding', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      console.log('Asset uploaded successfully to Cloudinary:', result.secure_url);
      return res.json({ 
        success: true, 
        url: result.secure_url 
      });
    } catch (e: any) {
      console.warn('Cloudinary upload failed, falling back to local storage:', e.message);
    }
  }

  // Fallback to local storage in public/uploads
  console.log('Using local fallback storage for uploaded asset');
  const uploadDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileExt = path.extname(req.file.originalname) || '.png';
  const filename = `${req.user.tenantId}_${Date.now()}${fileExt}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, req.file.buffer);

  const host = req.get('host') || 'localhost:5000';
  const protocol = req.protocol || 'http';
  
  const logoUrl = `${protocol}://${host}/uploads/${filename}`;
  console.log('Saved local asset to path:', filePath, 'URL:', logoUrl);

  res.json({
    success: true,
    url: logoUrl
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
