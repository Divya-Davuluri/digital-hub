import { Request, Response } from 'express';
import { db } from '../db';
import { users, workspaces, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { asyncHandler, AppError } from '../utils/errors';
import bcrypt from 'bcryptjs';

/**
 * GET /api/settings/profile
 */
export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new AppError('User not found', 404);

  // Remove password from response
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

/**
 * PATCH /api/settings/profile
 */
export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { name, email } = req.body;

  await db.update(users)
    .set({ name, email: email?.toLowerCase() })
    .where(eq(users.id, userId));

  res.json({ success: true, message: 'Profile updated' });
});

/**
 * PATCH /api/settings/password
 */
export const updatePassword = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.password) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password incorrect', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

  res.json({ success: true, message: 'Password updated successfully' });
});

/**
 * GET /api/settings/workspaces
 */
export const getWorkspaces = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  
  const allWorkspaces = await db.query.workspaces.findMany({
    where: eq(workspaces.tenantId, tenantId),
  });

  res.json(allWorkspaces);
});
