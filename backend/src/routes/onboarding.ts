import express from 'express';
import { db } from '../db';
import { users, clients, workspaces } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { authMiddleware, authorize, AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { asyncHandler, AppError } from '../utils/errors';

const router = express.Router();

// GET /api/admin/team-members
router.get('/team-members', authMiddleware, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const tenantId = req.user.tenantId;
  const teamMembers = await db.query.users.findMany({
    where: and(
      eq(users.tenantId, tenantId),
      eq(users.role, 'team')
    ),
    columns: {
      id: true,
      name: true,
      email: true
    }
  });
  res.json(teamMembers);
}));

// GET /api/admin/onboarding/check-email
router.get('/onboarding/check-email', authMiddleware, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const email = req.query.email as string;
  if (!email) throw new AppError('Email query parameter is required', 400);
  
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  });
  
  res.json({ exists: !!existingUser });
}));

// POST /api/admin/onboarding/client
router.post('/onboarding/client', authMiddleware, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { fullName, email, companyName, phone, plan, assignedTeamMemberId, sendWelcomeEmail } = req.body;
  const tenantId = req.user.tenantId;

  if (!fullName || !email) {
    throw new AppError('Name and email are required', 400);
  }

  // 1. Check if email exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // 2. Generate random password
  const temporaryPassword = Math.random().toString(36).slice(-8) + 'A1!';

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const userId = randomUUID();
  const newClientId = randomUUID();
  const newWorkspaceId = randomUUID();

  // 4. Create user
  await db.insert(users).values({
    id: userId,
    tenantId,
    name: fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'client',
    provider: 'local',
    twoFactorEnabled: 0,
    createdAt: new Date().toISOString()
  });

  // 5. Create client
  await db.insert(clients).values({
    id: newClientId,
    tenantId,
    name: companyName || fullName,
    email: email.toLowerCase(),
    companyName: companyName || null,
    phone: phone || null,
    plan: plan || 'STARTER',
    assignedTeamMemberId: assignedTeamMemberId || null,
    onboardingStatus: 'COMPLETED',
    status: 'active',
    createdAt: new Date().toISOString()
  });

  // 6. Create workspace
  await db.insert(workspaces).values({
    id: newWorkspaceId,
    tenantId,
    clientId: newClientId,
    clientName: fullName,
    plan: plan || 'STARTER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  // 7. Email Logging
  if (sendWelcomeEmail) {
    console.log('📧 Welcome Email Details:', { To: email, Password: temporaryPassword });
  }

  res.json({
    success: true,
    client: {
      id: newClientId,
      name: fullName,
      email: email,
      plan: plan || 'STARTER',
      temporaryPassword: temporaryPassword,
      workspaceId: newWorkspaceId,
      loginUrl: '/login'
    }
  });
}));

// GET /api/admin/clients
router.get('/clients', authMiddleware, authorize('admin'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const tenantId = req.user.tenantId;

  const results = await db.all(sql`
    SELECT id, name, email, company_name, status
    FROM clients
    WHERE tenant_id = ${tenantId}
    ORDER BY name ASC
  `);

  res.json({
    success: true,
    clients: results || []
  });
}));

export default router;
