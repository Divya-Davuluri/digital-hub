import { Response } from 'express';
import { db } from '../db';
import { tenantBranding } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/branding
 * Fetches branding for the current tenant.
 */
export const getBranding = async (req: AuthRequest, res: Response) => {
  try {
    // Priority: tenantId from subdomain detection, fallback to user's tenantId
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context missing' });
    }

    const settings = await db.query.tenantBranding.findFirst({
      where: eq(tenantBranding.tenantId, tenantId),
    });

    res.json(settings || { 
      primaryColor: '#4f46e5', 
      secondaryColor: '#10b981', 
      logoUrl: '',
      subdomain: '' 
    });
  } catch (error) {
    console.error('[GET_BRANDING_ERROR]', error);
    res.status(500).json({ message: 'Error fetching branding' });
  }
};

/**
 * POST /api/branding
 * Saves or updates branding for the current tenant.
 */
export const updateBranding = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId; // Always use authenticated user's tenant for saving

    if (!tenantId) {
      return res.status(401).json({ message: 'Unauthorized: Tenant required' });
    }

    const { logoUrl, primaryColor, secondaryColor, subdomain } = req.body;

    // Basic validation
    if (logoUrl && !logoUrl.startsWith('http')) {
      return res.status(400).json({ message: 'Logo URL must be a valid public URL' });
    }

    const existing = await db.query.tenantBranding.findFirst({
      where: eq(tenantBranding.tenantId, tenantId),
    });

    if (existing) {
      await db.update(tenantBranding)
        .set({ 
          logoUrl, 
          primaryColor, 
          secondaryColor, 
          subdomain, 
          updatedAt: new Date().toISOString() 
        })
        .where(eq(tenantBranding.tenantId, tenantId));
    } else {
      await db.insert(tenantBranding).values({
        id: uuidv4(),
        tenantId,
        logoUrl,
        primaryColor,
        secondaryColor,
        subdomain
      });
    }

    res.json({ message: 'Branding updated successfully' });
  } catch (error: any) {
    console.error('[UPDATE_BRANDING_ERROR]', error);
    if (error.message?.includes('UNIQUE constraint failed: tenant_branding.subdomain')) {
      return res.status(400).json({ message: 'Subdomain is already taken' });
    }
    res.status(500).json({ message: 'Error updating branding' });
  }
};
