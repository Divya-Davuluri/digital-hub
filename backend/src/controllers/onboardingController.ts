import { Response } from 'express';
import { db } from '../db';
import { users, workspaces } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { asyncHandler, AppError } from '../utils/errors';

/**
 * POST /api/onboarding/client/complete
 */
export const completeClientOnboarding = asyncHandler(async (req: any, res: Response) => {
  const { userId, tenantId, workspaceId } = req.user;
  const { companyName, logoUrl, primaryColor } = req.body;

  console.log(`[ONBOARDING_FINALIZE] START | User: ${userId} | Workspace: ${workspaceId}`);
  console.log(`[ONBOARDING_BODY]`, JSON.stringify(req.body));

  if (!workspaceId) {
    console.error(`[ONBOARDING_ERROR] Workspace context missing for user ${userId}`);
    throw new AppError('Workspace context missing. Please contact support.', 400);
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
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.tenantId, tenantId)));

    // 2. Mark User as onboarding completed with extra metadata
    console.log(`[ONBOARDING_STEP] 2. Updating User...`);
    await db.update(users)
      .set({ 
        onboardingCompleted: 1,
        onboardingStep: 'completed',
        firstLogin: 0 
      })
      .where(eq(users.id, userId));

    console.log(`[ONBOARDING_SUCCESS] User ${userId} finalized onboarding for workspace ${workspaceId}`);
    res.json({ success: true, message: 'Onboarding completed successfully' });
  } catch (error: any) {
    console.error(`[ONBOARDING_CRITICAL_FAILURE]`, error);
    throw new AppError(`Failed to finalize onboarding: ${error.message}`, 500);
  }
});
