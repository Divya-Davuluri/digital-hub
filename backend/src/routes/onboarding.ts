import express from 'express';
import { db } from '../db';
import { users, clients, workspaces } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, authorize, AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/admin/team-members
router.get('/team-members', authMiddleware, authorize('admin'), async (req: AuthRequest, res) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/onboarding/check-email
router.get('/onboarding/check-email', authMiddleware, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ exists: false });
    
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });
    
    res.json({ exists: !!existingUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/onboarding/client
router.post('/onboarding/client', authMiddleware, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { fullName, email, companyName, phone, plan, assignedTeamMemberId, sendWelcomeEmail } = req.body;
    const tenantId = req.user.tenantId;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // 1. Check if email exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 2. Generate random password
    const temporaryPassword = Math.random().toString(36).slice(-8) + 'A1!'; // 8 chars min

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    const userId = uuidv4();
    const clientId = uuidv4();
    const workspaceId = uuidv4();

    // 4. Create user
    await db.insert(users).values({
      id: userId,
      tenantId,
      name: fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'client',
      clientId,
      provider: 'local'
    });

    // 5. Create client
    await db.insert(clients).values({
      id: clientId,
      tenantId,
      name: companyName || fullName,
      email: email.toLowerCase(),
      companyName,
      phone,
      plan: plan || 'STARTER',
      assignedTeamMemberId: assignedTeamMemberId || null,
      onboardingStatus: 'COMPLETED',
      status: 'active'
    });

    // 6. Create workspace
    await db.insert(workspaces).values({
      id: workspaceId,
      tenantId,
      clientId,
      clientName: fullName,
      plan: plan || 'STARTER',
      status: 'ACTIVE'
    });

    // 7. If sendWelcomeEmail is true
    if (sendWelcomeEmail) {
      console.log('📧 Welcome Email Details:');
      console.log(`To: ${email}`);
      console.log(`Subject: Welcome to your Workspace!`);
      console.log(`Password: ${temporaryPassword}`);
    }

    // 8. Return response
    return res.json({
      success: true,
      client: {
        id: clientId,
        name: fullName,
        email: email,
        plan: plan,
        temporaryPassword,
        workspaceId,
        loginUrl: '/login'
      }
    });

  } catch (err: any) {
    console.error('[ONBOARDING_CLIENT_ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
