import { Request, Response } from 'express';
import { db } from '../db';
import { workspaces, tenantBranding } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/branding
 * Fetches branding for the current workspace context.
 */
export const getBranding = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role } = req.user as any;
    const targetWorkspaceId = workspaceId || req.query.workspaceId;

    if (!tenantId) {
      return res.json({ 
        primaryColor: '#4f46e5', 
        secondaryColor: '#10b981',
        logoUrl: '',
        subdomain: '',
      });
    }

    // 1. Fetch Tenant Branding (Agency-wide)
    const branding = await db.query.tenantBranding.findFirst({
      where: eq(tenantBranding.tenantId, tenantId),
    });

    // 2. Fetch Workspace Branding (if context provided)
    let workspaceBranding = null;
    if (targetWorkspaceId) {
      workspaceBranding = await db.query.workspaces.findFirst({
        where: and(eq(workspaces.id, targetWorkspaceId), eq(workspaces.tenantId, tenantId)),
      });
    }

    // Return combined branding (Workspace overrides Tenant)
    res.json({
      primaryColor: workspaceBranding?.primaryColor || branding?.primaryColor || '#4f46e5',
      secondaryColor: branding?.secondaryColor || '#10b981',
      logoUrl: branding?.logoUrl || '',
      logo: workspaceBranding?.logo || branding?.logoUrl || '', // Compatibility
      subdomain: branding?.subdomain || '',
      name: workspaceBranding?.name || 'My Agency'
    });
    
  } catch (error) {
    console.error('[GET_BRANDING_ERROR]', error);
    res.status(500).json({ message: 'Error fetching branding' });
  }
};

/**
 * POST /api/branding
 * Updates branding for a specific workspace.
 */
export const updateBranding = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId: tokenWorkspaceId } = req.user as any;
    const { logo, logoUrl, primaryColor, secondaryColor, subdomain, workspaceId: bodyWorkspaceId } = req.body;
    
    const targetWorkspaceId = tokenWorkspaceId || bodyWorkspaceId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Unauthorized: Tenant context required' });
    }

    // 1. Update Tenant Branding
    const existingBranding = await db.query.tenantBranding.findFirst({
      where: eq(tenantBranding.tenantId, tenantId),
    });

    if (existingBranding) {
      await db.update(tenantBranding)
        .set({ 
          logoUrl: logoUrl || logo, 
          primaryColor, 
          secondaryColor, 
          subdomain, 
          updatedAt: new Date().toISOString() 
        })
        .where(eq(tenantBranding.tenantId, tenantId));
    } else {
      const { v4: uuidv4 } = require('uuid');
      await db.insert(tenantBranding).values({
        id: uuidv4(),
        tenantId,
        logoUrl: logoUrl || logo,
        primaryColor: primaryColor || '#4f46e5',
        secondaryColor: secondaryColor || '#10b981',
        subdomain,
      });
    }

    // 2. Update Workspace Branding if in workspace context
    if (targetWorkspaceId) {
      await db.update(workspaces)
        .set({ 
          logo: logo || logoUrl, 
          primaryColor, 
          updatedAt: new Date().toISOString() 
        })
        .where(and(eq(workspaces.id, targetWorkspaceId), eq(workspaces.tenantId, tenantId)));
    }

    res.json({ success: true, message: 'Branding updated successfully' });
  } catch (error: any) {
    console.error('[UPDATE_BRANDING_ERROR]', error);
    res.status(500).json({ message: 'Error updating branding' });
  }
};
