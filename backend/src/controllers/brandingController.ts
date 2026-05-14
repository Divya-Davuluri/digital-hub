import { Request, Response } from 'express';
import { db } from '../db';
import { tenants, customDomains } from '../db/schema';
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
 * FIX 1: Returns branding from the tenants table with EXACT field names for the frontend.
 */
export const getBranding = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });
  if (!tenant) throw new AppError('Tenant not found', 404);
  
  res.json({
    agencyName:      tenant.name || '',
    primaryColor:    tenant.primaryColor || '#6366f1',
    secondaryColor:  tenant.secondaryColor || '#4f46e5',
    logoUrl:         tenant.logoUrl || '',
    faviconUrl:      tenant.faviconUrl || '',
    customCss:       tenant.customCss || '',
    footerText:      tenant.footerText || '',
    supportEmail:    tenant.supportEmail || '',
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
    agencyName, primaryColor, secondaryColor,
    logoUrl, faviconUrl, customCss,
    footerText, supportEmail, removePoweredBy
  } = req.body;

  const updateData: any = {};
  if (agencyName !== undefined) updateData.name = agencyName;
  if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
  if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl;
  if (customCss !== undefined) updateData.customCss = customCss;
  if (footerText !== undefined) updateData.footerText = footerText;
  if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
  if (removePoweredBy !== undefined) updateData.removePoweredBy = removePoweredBy;

  await db.update(tenants)
    .set(updateData)
    .where(eq(tenants.id, tenantId));

  res.json({ success: true, message: 'Branding saved' });
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
