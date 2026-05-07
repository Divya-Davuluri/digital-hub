import express from 'express';
import { db } from '../db';
import { users, clients, workspaces } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { asyncHandler, AppError } from '../utils/errors';

const router = express.Router();

// GET /api/admin/team-members
router.get('/team-members', authMiddleware, authorize('admin'), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { tenantId } = req.user as any;
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

// POST /api/admin/onboarding/client
router.post('/onboarding/client', authMiddleware, authorize('admin'), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { fullName, email, companyName, plan, assignedTeamMemberId, sendWelcomeEmail } = req.body;
  const { tenantId } = req.user as any;

  if (!fullName || !email) throw new AppError('Name and email are required', 400);

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  });

  if (existingUser) throw new AppError('Email already registered', 400);

  const temporaryPassword = Math.random().toString(36).slice(-8) + 'A1!';
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const userId = randomUUID();
  const clientId = randomUUID();
  const workspaceId = randomUUID();

  // 1. Create Workspace
  await db.insert(workspaces).values({
    id: workspaceId,
    tenantId,
    clientId: clientId,
    clientName: fullName,
    name: companyName || fullName,
    slug: (companyName || fullName).toLowerCase().replace(/[^a-z0-9]/g, '-'),
  });

  // 2. Create User linked to Workspace
  await db.insert(users).values({
    id: userId,
    tenantId,
    workspaceId,
    name: fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'client',
    provider: 'local',
  });

  // 3. Create Client linked to Workspace
  await db.insert(clients).values({
    id: clientId,
    tenantId,
    workspaceId,
    name: fullName,
    email: email.toLowerCase(),
    companyName: companyName || null,
    status: 'active',
  });

  if (sendWelcomeEmail) {
    console.log('📧 Welcome Email Details:', { To: email, Password: temporaryPassword });
  }

  res.json({
    success: true,
    client: {
      id: clientId,
      name: fullName,
      email: email,
      temporaryPassword,
      workspaceId,
    }
  });
}));

// GET /api/admin/clients
router.get('/clients', authMiddleware, authorize('admin'), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { tenantId } = req.user as any;

  const results = await db.all(sql`
    SELECT c.*, w.slug as workspace_slug
    FROM clients c
    JOIN workspaces w ON c.workspace_id = w.id
    WHERE c.tenant_id = ${tenantId}
    ORDER BY c.name ASC
  `);

  res.json({ success: true, clients: results || [] });
}));

export default router;
