import { Request, Response } from 'express';
import { db } from '../db';
import { workspaces } from '../db/schema';
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
        logo: '',
      });
    }

    if (targetWorkspaceId) {
      const workspace = await db.query.workspaces.findFirst({
        where: and(eq(workspaces.id, targetWorkspaceId), eq(workspaces.tenantId, tenantId)),
      });

      if (workspace) {
        return res.json({
          primaryColor: workspace.primaryColor || '#4f46e5',
          logo: workspace.logo || '',
          name: workspace.name
        });
      }
    }

    // Default Agency Branding (optional: fetch from a default workspace or tenant settings)
    res.json({ 
      primaryColor: '#4f46e5', 
      logo: '',
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
    const { logo, primaryColor, workspaceId: bodyWorkspaceId } = req.body;
    
    const targetWorkspaceId = tokenWorkspaceId || bodyWorkspaceId;

    if (!tenantId || !targetWorkspaceId) {
      return res.status(401).json({ message: 'Unauthorized: Workspace context required' });
    }

    await db.update(workspaces)
      .set({ 
        logo, 
        primaryColor, 
        updatedAt: new Date().toISOString() 
      })
      .where(and(eq(workspaces.id, targetWorkspaceId), eq(workspaces.tenantId, tenantId)));

    res.json({ success: true, message: 'Workspace branding updated successfully' });
  } catch (error: any) {
    console.error('[UPDATE_BRANDING_ERROR]', error);
    res.status(500).json({ message: 'Error updating branding' });
  }
};
