import { Response } from 'express';
import { db } from '../db';
import { users, workspaces } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { asyncHandler, AppError } from '../utils/errors';

/**
 * POST /api/onboarding/client/complete
 */
export const completeClientOnboarding = asyncHandler(async (req: any, res: Response) => {
  const { id, tenantId, workspaceId } = req.user;
  const userId = id; // Maintain userId variable for consistency below
  const { companyName, logoUrl, primaryColor } = req.body;

  console.log(`[ONBOARDING_FINALIZE] START | User: ${userId} | Workspace: ${workspaceId}`);
  console.log(`[ONBOARDING_BODY]`, JSON.stringify(req.body));

  let activeWorkspaceId = workspaceId;

  if (!activeWorkspaceId) {
    console.warn(`[ONBOARDING_RECOVERY] Workspace context missing for user ${userId}. Attempting auto-recovery...`);
    try {
      const fallbackTenantId = tenantId || 'default-tenant';
      let workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.tenantId, fallbackTenantId)
      });

      let workspaceRecord: any = workspace;

      if (!workspaceRecord) {
        const fallbackId = 'default-workspace';
        await db.insert(workspaces).values({
          id: fallbackId,
          tenantId: fallbackTenantId,
          name: 'Default Workspace',
          slug: 'default-slug',
          status: 'active'
        }).catch(() => {});

        workspaceRecord = {
          id: fallbackId,
          tenantId: fallbackTenantId,
          name: 'Default Workspace',
          slug: 'default-slug',
          status: 'active'
        };
      }

      await db.update(users).set({ workspaceId: workspaceRecord.id }).where(eq(users.id, userId));
      activeWorkspaceId = workspaceRecord.id;
      req.user.workspaceId = workspaceRecord.id;
      console.log(`[ONBOARDING_RECOVERY] Successfully resolved missing workspace by assigning ${workspaceRecord.id}`);
    } catch (err: any) {
      console.error('[ONBOARDING_RECOVERY] Failed to auto-recover workspace:', err.message);
      throw new AppError('Workspace context missing. Please contact support.', 400);
    }
  }

  try {
    // 1. Update Workspace details (Branding)
    console.log(`[ONBOARDING_STEP] 1. Updating Workspace...`);
    await db.update(workspaces)
      .set({
        name: companyName || undefined,
        logo: logoUrl || undefined,
        primaryColor: primaryColor || undefined,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(workspaces.id, activeWorkspaceId), eq(workspaces.tenantId, tenantId)));

    // 2. Mark User as onboarding completed with extra metadata
    console.log(`[ONBOARDING_STEP] 2. Updating User...`);
    await db.update(users)
      .set({ 
        onboardingCompleted: 1,
        onboardingStep: 'completed',
        firstLogin: 0 
      })
      .where(eq(users.id, userId));

    console.log(`[ONBOARDING_SUCCESS] User ${userId} finalized onboarding for workspace ${activeWorkspaceId}`);
    res.json({ success: true, message: 'Onboarding completed successfully' });
  } catch (error: any) {
    console.error(`[ONBOARDING_CRITICAL_FAILURE]`, error);
    throw new AppError(`Failed to finalize onboarding: ${error.message}`, 500);
  }
});
