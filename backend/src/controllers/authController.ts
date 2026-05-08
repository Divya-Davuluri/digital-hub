import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../db';
import { users, backupCodes, sessions, resetTokens, tenants, workspaces } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from '../utils/crypto';
import { getCookieOptions } from '../config/cookies';
import { asyncHandler, AppError } from '../utils/errors';
import { config } from '../config/env';

// --- Validation Schemas ---
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string(),
});

const validate2FASchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  token: z.string().min(6, 'Invalid code'),
});

// --- Token Utility ---
export const generateTokens = async (userId: string, role: string, tenantId: string, workspaceId?: string | null) => {
  const token = jwt.sign(
    { userId, role, tenantId, workspaceId }, 
    config.jwtSecret, 
    { expiresIn: '2h' }
  );
  
  const refreshToken = jwt.sign(
    { userId }, 
    config.refreshSecret, 
    { expiresIn: '7d' }
  );

  const sessionId = uuidv4();
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    tenantId: tenantId || null,
    workspaceId: workspaceId || null,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { token, refreshToken };
};

// --- Controllers ---

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validated = registerSchema.parse(req.body);
  const { name, email, password } = validated;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  
  // For public signup, we use a default tenant or the one provided by the admin context
  // Based on the user's setup, we'll use the provided admin tenant_id
  const DEFAULT_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';
  
  // 1. Create User as 'client' by default
  await db.insert(users).values({
    id: userId,
    tenantId: DEFAULT_TENANT_ID,
    workspaceId: null, // Clients start without a workspace until assigned
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    provider: 'local',
    role: 'client', 
  });

  res.status(201).json({ 
    success: true,
    message: 'Account created successfully. Please log in.',
    user: { id: userId, email, name, role: 'client' } 
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validated = loginSchema.parse(req.body);
  const { email, password } = validated;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.password) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.twoFactorEnabled) {
    return res.json({ success: true, status: "2FA_REQUIRED", userId: user.id });
  }

  const { token, refreshToken } = await generateTokens(user.id, user.role, user.tenantId, user.workspaceId);
  
  const cookieOptions = getCookieOptions(7);
  res.cookie('token', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id));

  res.json({ 
    success: true,
    token, 
    refreshToken, 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role, 
      tenantId: user.tenantId,
      workspaceId: user.workspaceId
    } 
  });
});

export const validate2FA = asyncHandler(async (req: Request, res: Response) => {
  const validated = validate2FASchema.parse(req.body);
  const { userId, token } = validated;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.twoFactorSecret) {
    throw new AppError('2FA not enabled', 400);
  }

  const decryptedSecret = decrypt(user.twoFactorSecret);
  const isTotpValid = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token,
    window: 1 
  });

  let isValid = isTotpValid;

  if (!isValid) {
    const userBackupCodes = await db.query.backupCodes.findMany({
      where: and(eq(backupCodes.userId, userId), eq(backupCodes.used, 0)),
    });

    for (const bc of userBackupCodes) {
      const match = await bcrypt.compare(token, bc.code);
      if (match) {
        isValid = true;
        await db.update(backupCodes).set({ used: 1 }).where(eq(backupCodes.id, bc.id));
        break;
      }
    }
  }

  if (!isValid) {
    throw new AppError('Invalid or expired code', 400);
  }

  const { token: accessToken, refreshToken } = await generateTokens(user.id, user.role, user.tenantId, user.workspaceId);
  
  const cookieOptions = getCookieOptions(7);
  res.cookie('token', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id));

  res.json({ 
    success: true,
    token: accessToken, 
    refreshToken, 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role, 
      tenantId: user.tenantId,
      workspaceId: user.workspaceId
    } 
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 401);

  const session = await db.query.sessions.findFirst({ where: eq(sessions.refreshToken, refreshToken) });
  if (!session || new Date() > session.expiresAt) throw new AppError('Invalid or expired refresh token', 401);

  const decoded: any = jwt.verify(refreshToken, config.refreshSecret);
  const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) });
  if (!user) throw new AppError('User no longer exists', 401);
  
  const newTokens = await generateTokens(user.id, user.role, user.tenantId, user.workspaceId);
  await db.delete(sessions).where(eq(sessions.id, session.id));
  res.json({ success: true, ...newTokens });
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const validated = req.body; 
  const userId = req.user.id;
  await db.update(users).set(validated).where(eq(users.id, userId));
  const updatedUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
  res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
});

export const setup2FA = asyncHandler(async (req: any, res: Response) => {
  const user = req.user;
  const secret = speakeasy.generateSecret({ 
    length: 20,
    name: `DMHub (${user.email})`,
    issuer: 'DMHub'
  });
  const encryptedTempSecret = encrypt(secret.base32);
  await db.update(users).set({ twoFactorTempSecret: encryptedTempSecret }).where(eq(users.id, user.id));
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  res.json({ success: true, qrCode: qrCodeUrl, secret: secret.base32 });
});

export const verify2FA = asyncHandler(async (req: any, res: Response) => {
  const { token } = req.body;
  const user = req.user;
  const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (!dbUser || !dbUser.twoFactorTempSecret) throw new AppError('2FA setup not initiated', 400);
  const tempSecret = decrypt(dbUser.twoFactorTempSecret);
  const verified = speakeasy.totp.verify({ secret: tempSecret, encoding: 'base32', token, window: 1 });
  if (!verified) throw new AppError('Invalid verification code', 400);
  await db.update(users).set({ twoFactorEnabled: 1, twoFactorSecret: dbUser.twoFactorTempSecret, twoFactorTempSecret: null }).where(eq(users.id, user.id));
  const rawCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
  for (const code of rawCodes) {
    const hashedCode = await bcrypt.hash(code, 10);
    await db.insert(backupCodes).values({ userId: user.id, code: hashedCode, used: 0 });
  }
  res.json({ success: true, message: '2FA enabled successfully', backupCodes: rawCodes });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new AppError('User not found', 404);
  const token = crypto.randomBytes(32).toString('hex');
  await db.insert(resetTokens).values({ userId: user.id, token, type: 'password', expiresAt: new Date(Date.now() + 3600000) });
  res.json({ success: true, message: 'Reset link sent', token });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const resetToken = await db.query.resetTokens.findFirst({ where: and(eq(resetTokens.token, token), eq(resetTokens.type, 'password')) });
  if (!resetToken || new Date() > resetToken.expiresAt) throw new AppError('Invalid or expired token', 400);
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, resetToken.userId));
  await db.delete(resetTokens).where(eq(resetTokens.id, resetToken.id));
  res.json({ success: true, message: 'Password reset successfully' });
});

export const reset2FARequest = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new AppError('User not found', 404);
  const token = crypto.randomBytes(32).toString('hex');
  await db.insert(resetTokens).values({ userId: user.id, token, type: '2fa', expiresAt: new Date(Date.now() + 3600000) });
  res.json({ success: true, message: '2FA reset link sent', token });
});

export const reset2FAConfirm = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const resetToken = await db.query.resetTokens.findFirst({ where: and(eq(resetTokens.token, token), eq(resetTokens.type, '2fa')) });
  if (!resetToken || new Date() > resetToken.expiresAt) throw new AppError('Invalid or expired token', 400);
  await db.update(users).set({ twoFactorEnabled: 0, twoFactorSecret: null }).where(eq(users.id, resetToken.userId));
  await db.delete(resetTokens).where(eq(resetTokens.id, resetToken.id));
  await db.delete(backupCodes).where(eq(backupCodes.userId, resetToken.userId));
  res.json({ success: true, message: '2FA disabled successfully' });
});

export const disable2FA_Dev = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await db.update(users).set({ twoFactorEnabled: 0, twoFactorSecret: null }).where(eq(users.email, email));
  res.json({ success: true, message: '2FA disabled (DEV MODE)' });
});

export const logout = asyncHandler(async (req: any, res: Response) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});
