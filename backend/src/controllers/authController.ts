import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../db';
import { users, backupCodes, sessions, resetTokens, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from '../utils/crypto';
import { getCookieOptions } from '../config/cookies';

const JWT_SECRET = process.env.JWT_SECRET || 'digital-marketing-hub-v1-secret-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'digital-marketing-hub-v1-refresh-key-2026';

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

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
});

// --- Utilities ---
export const generateTokens = async (userId: string, role: string, tenantId: string, clientId?: string | null) => {
  console.log(`🔑 GENERATING TOKENS - User: ${userId}, Role: ${role}, Tenant: ${tenantId}, Client: ${clientId}`);
  
  const token = jwt.sign(
    { userId, role, tenantId, clientId }, 
    JWT_SECRET, 
    { expiresIn: '2h' }
  );
  
  const refreshToken = jwt.sign(
    { userId }, 
    REFRESH_SECRET, 
    { expiresIn: '7d' }
  );

  await db.insert(sessions).values({
    userId,
    tenantId,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { token, refreshToken };
};

// --- Auth Controllers ---

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { name, email, password } = validated;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const tenantId = uuidv4();

    // Create a new tenant for the user with a unique subdomain
    const subdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
    await db.insert(tenants).values({
      id: tenantId,
      name: `${name}'s Agency`,
      subdomain,
    });

    await db.insert(users).values({
      id: userId,
      tenantId,
      name,
      email,
      password: hashedPassword,
      provider: 'local',
      role: 'admin', 
    });

    const { token, refreshToken } = await generateTokens(userId, 'admin', tenantId, null);
    
    // Set tokens in cookies
    const cookieOptions = getCookieOptions(7);
    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(201).json({ 
      token, 
      refreshToken, 
      user: { id: userId, email, name, role: 'admin', tenantId } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || 'Registration failed' });
    }
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    console.log(`🔐 LOGIN ATTEMPT - Email: ${email}`);
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      console.log(`❌ LOGIN FAILED - User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      console.log(`❌ LOGIN FAILED - Password mismatch: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.twoFactorEnabled) {
      return res.json({ status: "2FA_REQUIRED", userId: user.id });
    }

    const { token, refreshToken } = await generateTokens(user.id, user.role, user.tenantId || '', user.clientId);
    
    // Set tokens in cookies
    const cookieOptions = getCookieOptions(7);
    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({ 
      token, 
      refreshToken, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        tenantId: user.tenantId 
      } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || 'Login failed' });
    }
    res.status(500).json({ message: 'Login failed' });
  }
};

export const validate2FA = async (req: Request, res: Response) => {
  try {
    const validated = validate2FASchema.parse(req.body);
    const { userId, token } = validated;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not enabled' });
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
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const { token: accessToken, refreshToken } = await generateTokens(user.id, user.role, user.tenantId || '');
    
    // Set tokens in cookies
    const cookieOptions = getCookieOptions(7);
    res.cookie('token', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({ 
      token: accessToken, 
      refreshToken, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        tenantId: user.tenantId 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

export const setup2FA = async (req: any, res: Response) => {
  try {
    const user = req.user;
    const secret = speakeasy.generateSecret({ 
      length: 20,
      name: `DMHub (${user.email})`,
      issuer: 'DMHub'
    });
    const encryptedTempSecret = encrypt(secret.base32);
    await db.update(users).set({ twoFactorTempSecret: encryptedTempSecret }).where(eq(users.id, user.id));
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    res.json({ qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
};

export const verify2FA = async (req: any, res: Response) => {
  try {
    const { token } = req.body;
    const user = req.user;
    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!dbUser || !dbUser.twoFactorTempSecret) return res.status(400).json({ message: '2FA setup not initiated' });
    const tempSecret = decrypt(dbUser.twoFactorTempSecret);
    const verified = speakeasy.totp.verify({ secret: tempSecret, encoding: 'base32', token, window: 1 });
    if (!verified) return res.status(400).json({ message: 'Invalid verification code' });
    await db.update(users).set({ twoFactorEnabled: 1, twoFactorSecret: dbUser.twoFactorTempSecret, twoFactorTempSecret: null }).where(eq(users.id, user.id));
    const rawCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    for (const code of rawCodes) {
      const hashedCode = await bcrypt.hash(code, 10);
      await db.insert(backupCodes).values({ userId: user.id, code: hashedCode, used: 0 });
    }
    res.json({ message: '2FA enabled successfully', backupCodes: rawCodes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
    const session = await db.query.sessions.findFirst({ where: eq(sessions.refreshToken, refreshToken) });
    if (!session || new Date() > session.expiresAt) return res.status(401).json({ message: 'Invalid or expired refresh token' });
    const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) });
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    
    const newTokens = await generateTokens(user.id, user.role, user.tenantId || '');
    await db.delete(sessions).where(eq(sessions.id, session.id));
    res.json(newTokens);
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    await db.insert(resetTokens).values({ userId: user.id, token, type: 'password', expiresAt: new Date(Date.now() + 3600000) });
    res.json({ message: 'Reset link sent', token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const resetToken = await db.query.resetTokens.findFirst({ where: and(eq(resetTokens.token, token), eq(resetTokens.type, 'password')) });
    if (!resetToken || new Date() > resetToken.expiresAt) return res.status(400).json({ message: 'Invalid or expired token' });
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, resetToken.userId));
    await db.delete(resetTokens).where(eq(resetTokens.id, resetToken.id));
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

export const reset2FARequest = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    await db.insert(resetTokens).values({ userId: user.id, token, type: '2fa', expiresAt: new Date(Date.now() + 3600000) });
    res.json({ message: '2FA reset link sent', token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process request' });
  }
};

export const reset2FAConfirm = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const resetToken = await db.query.resetTokens.findFirst({ where: and(eq(resetTokens.token, token), eq(resetTokens.type, '2fa')) });
    if (!resetToken || new Date() > resetToken.expiresAt) return res.status(400).json({ message: 'Invalid or expired token' });
    await db.update(users).set({ twoFactorEnabled: 0, twoFactorSecret: null }).where(eq(users.id, resetToken.userId));
    await db.delete(resetTokens).where(eq(resetTokens.id, resetToken.id));
    await db.delete(backupCodes).where(eq(backupCodes.userId, resetToken.userId));
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset 2FA' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const userId = req.user.id;
    await db.update(users).set(validated).where(eq(users.id, userId));
    const updatedUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    res.json({ message: 'Profile updated successfully', user: { id: updatedUser?.id, name: updatedUser?.name, email: updatedUser?.email } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const disable2FA_Dev = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await db.update(users).set({ twoFactorEnabled: 0, twoFactorSecret: null }).where(eq(users.email, email));
    res.json({ message: '2FA disabled (DEV MODE)' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
};
