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

  if (!workspaceId) {
    throw new AppError('Workspace not found', 400);
  }

  // 1. Update Workspace details
  await db.update(workspaces)
    .set({
      name: companyName || undefined,
      logo: logoUrl || undefined,
      primaryColor: primaryColor || undefined,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.tenantId, tenantId)));

  // 2. Mark User as onboarding completed
  await db.update(users)
    .set({ onboardingCompleted: 1 })
    .where(eq(users.id, userId));

  res.json({ success: true, message: 'Onboarding completed successfully' });
});
