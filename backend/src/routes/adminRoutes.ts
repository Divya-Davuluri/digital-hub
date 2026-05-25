import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { db } from '../db';
import { sql, and, or, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { users, clients, teamAssignments } from '../db/schema';

const router = Router();

router.use(authMiddleware);
router.use(authorize('admin'));

// GET /api/admin/campaigns
router.get('/campaigns', 
  async (req: any, res: any) => {
  try {
    const tenantId = 
      req.user?.tenantId ||
      req.user?.tenant_id || '';

    const campaigns = await db.all(sql`
      SELECT 
        c.id,
        c.name,
        c.client_name,
        c.status,
        c.budget,
        c.spent,
        c.platform,
        c.start_date,
        c.end_date,
        c.impressions,
        c.clicks,
        c.conversions,
        c.created_at
      FROM campaigns c
      WHERE c.tenant_id = ${tenantId}
      ORDER BY c.created_at DESC
    `);

    return res.json({
      success: true,
      campaigns: campaigns || [],
      total: campaigns?.length || 0
    });

  } catch (error: any) {
    console.error('GET campaigns:', 
      error.message);
    return res.status(500).json({
      success: false,
      campaigns: [],
      error: error.message
    });
  }
});

// POST /api/admin/campaigns
router.post('/campaigns',
  async (req: any, res: any) => {
  try {
    const tenantId = 
      req.user?.tenantId ||
      req.user?.tenant_id || '';
    const userId = req.user?.id || '';

    const {
      name, clientName, clientId,
      budget, platform, status,
      startDate, endDate, description
    } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required'
      });
    }

    const campaignId = randomUUID();
    const now = new Date().toISOString();

    await db.run(sql`
      INSERT INTO campaigns (
        id, tenant_id, name,
        client_id, client_name,
        status, budget, spent,
        impressions, clicks, conversions,
        platform, start_date, end_date,
        assigned_team_member_id,
        created_by, created_at
      ) VALUES (
        ${campaignId},
        ${tenantId},
        ${name.trim()},
        ${clientId || null},
        ${clientName || null},
        ${status || 'ACTIVE'},
        ${Number(budget) || 0},
        0, 0, 0, 0,
        ${platform || 'Meta'},
        ${startDate || null},
        ${endDate || null},
        ${userId},
        ${userId},
        ${now}
      )
    `);

    return res.status(201).json({
      success: true,
      campaign: {
        id: campaignId,
        name: name.trim(),
        client_name: clientName || '',
        status: status || 'ACTIVE',
        budget: Number(budget) || 0,
        spent: 0,
        platform: platform || 'Meta',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        created_at: now
      }
    });

  } catch (error: any) {
    console.error('POST campaigns:', 
      error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/admin/campaigns/:id
router.patch('/campaigns/:id',
  async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tenantId = 
      req.user?.tenantId ||
      req.user?.tenant_id || '';
    const { status } = req.body || {};

    await db.run(sql`
      UPDATE campaigns
      SET status = ${status}
      WHERE id = ${id}
      AND tenant_id = ${tenantId}
    `);

    return res.json({ success: true });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// --- Team Members API ---

router.get('/team-members', async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId || 'default-tenant';
    
    // Fetch all members & assignments
    const allUsers = await db.select().from(users).where(eq(users.tenantId, tenantId));
    const teamMembers = allUsers.filter(u => u.role === 'team' || (u.role as string) === 'TEAM_MEMBER');

    const allAssignments = await db.select().from(teamAssignments).where(eq(teamAssignments.tenantId, tenantId));
    const allClients = await db.select().from(clients).where(eq(clients.tenantId, tenantId));
    
    // Safely query SEO Projects directly from database to prevent schema dependencies causing compilation crashes
    const allProjectsFromDb = await db.all(sql`SELECT id, project_name, domain FROM seo_projects WHERE tenant_id = ${tenantId}`).catch(() => []);

    const result = teamMembers.map(member => {
      const memberAssignments = allAssignments.filter(a => a.userId === member.id || a.teamMemberId === member.id);
      
      const assignedClients = memberAssignments
        .map(a => {
          const client = allClients.find(c => c.id === a.clientId);
          return client ? { id: client.id, name: client.name } : null;
        })
        .filter(Boolean);

      const assignedProjects = memberAssignments
        .map(a => {
          const proj = (allProjectsFromDb as any[]).find((p: any) => p.id === a.projectId || p.id === a.campaignId);
          return proj ? { id: (proj as any).id, name: (proj as any).project_name } : null;
        })
        .filter(Boolean);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role === 'team' ? 'TEAM_MEMBER' : member.role,
        status: member.status || 'active',
        assignedClients,
        assignedProjects,
        createdAt: member.createdAt,
      };
    });

    return res.json({ success: true, teamMembers: result });
  } catch (err: any) {
    console.error('GET team-members:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/team-members', async (req: any, res: any) => {
  try {
    const { name, email, password, role, assignedClients, assignedProjects, status } = req.body;
    const adminUser = req.user;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const tenantId = adminUser.tenantId || 'default-tenant';
    const workspaceId = adminUser.workspaceId || 'default-workspace';

    // Check if email already registered
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, error: 'User with this email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUserId = randomUUID();

    const dbRole = (role === 'TEAM_MEMBER' ? 'team' : role) || 'team';
    await db.insert(users).values({
      id: newUserId,
      tenantId,
      workspaceId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: dbRole as any,
      status: status || 'active',
      provider: 'local',
    });

    // Insert client assignments
    if (Array.isArray(assignedClients) && assignedClients.length > 0) {
      for (const clientId of assignedClients) {
        const clientObj = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
        const cwId = clientObj?.[0]?.workspaceId || workspaceId;
        
        await db.insert(teamAssignments).values({
          id: randomUUID(),
          tenantId,
          workspaceId: cwId,
          userId: newUserId,
          teamMemberId: newUserId,
          clientId,
          assignedBy: adminUser.id,
          status: 'active'
        });
      }
    }

    // Insert project assignments
    if (Array.isArray(assignedProjects) && assignedProjects.length > 0) {
      for (const projectId of assignedProjects) {
        const projectObj = await db.all(sql`SELECT workspace_id FROM seo_projects WHERE id = ${projectId}`).catch(() => []);
        const pwId = (projectObj as any)?.[0]?.workspace_id || workspaceId;

        await db.insert(teamAssignments).values({
          id: randomUUID(),
          tenantId,
          workspaceId: pwId,
          userId: newUserId,
          teamMemberId: newUserId,
          projectId,
          campaignId: projectId,
          assignedBy: adminUser.id,
          status: 'active'
        });
      }
    }

    return res.status(201).json({ success: true, message: 'Team member created successfully', userId: newUserId });
  } catch (err: any) {
    console.error('POST team-members:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/team-members/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, email, password, assignedClients, assignedProjects, status } = req.body;
    const adminUser = req.user;
    const tenantId = adminUser.tenantId || 'default-tenant';
    const workspaceId = adminUser.workspaceId || 'default-workspace';

    const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (status) updateData.status = status;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
      updateData.passwordHash = hashedPassword;
    }
    updateData.updatedAt = new Date().toISOString();

    await db.update(users).set(updateData).where(eq(users.id, id));

    // Clear and update assignments
    await db.delete(teamAssignments).where(
      and(
        eq(teamAssignments.tenantId, tenantId),
        or(eq(teamAssignments.userId, id), eq(teamAssignments.teamMemberId, id))
      )
    );

    if (Array.isArray(assignedClients)) {
      for (const clientId of assignedClients) {
        const clientObj = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
        const cwId = clientObj?.[0]?.workspaceId || workspaceId;

        await db.insert(teamAssignments).values({
          id: randomUUID(),
          tenantId,
          workspaceId: cwId,
          userId: id,
          teamMemberId: id,
          clientId,
          assignedBy: adminUser.id,
          status: 'active'
        });
      }
    }

    if (Array.isArray(assignedProjects)) {
      for (const projectId of assignedProjects) {
        const projectObj = await db.all(sql`SELECT workspace_id FROM seo_projects WHERE id = ${projectId}`).catch(() => []);
        const pwId = (projectObj as any)?.[0]?.workspace_id || workspaceId;

        await db.insert(teamAssignments).values({
          id: randomUUID(),
          tenantId,
          workspaceId: pwId,
          userId: id,
          teamMemberId: id,
          projectId,
          campaignId: projectId,
          assignedBy: adminUser.id,
          status: 'active'
        });
      }
    }

    return res.json({ success: true, message: 'Team member updated successfully' });
  } catch (err: any) {
    console.error('PUT team-members:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/team-members/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;
    const tenantId = adminUser.tenantId || 'default-tenant';

    const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    if (existing[0].role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete admin users' });
    }

    // Delete assignments
    await db.delete(teamAssignments).where(
      and(
        eq(teamAssignments.tenantId, tenantId),
        or(eq(teamAssignments.userId, id), eq(teamAssignments.teamMemberId, id))
      )
    );

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    return res.json({ success: true, message: 'Team member deleted successfully' });
  } catch (err: any) {
    console.error('DELETE team-members:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --- Team Assignments API ---

router.get('/team-assignments', async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const assignments = await db.select().from(teamAssignments).where(eq(teamAssignments.tenantId, tenantId));
    return res.json({ success: true, assignments });
  } catch (err: any) {
    console.error('GET team-assignments:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/team-assignments', async (req: any, res: any) => {
  try {
    const { teamMemberId, clientId, projectId, status } = req.body;
    const adminUser = req.user;
    const tenantId = adminUser.tenantId || 'default-tenant';
    const workspaceId = adminUser.workspaceId || 'default-workspace';

    if (!teamMemberId) {
      return res.status(400).json({ success: false, error: 'teamMemberId is required' });
    }

    let cwId = workspaceId;
    if (clientId) {
      const clientObj = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      cwId = clientObj?.[0]?.workspaceId || workspaceId;
    } else if (projectId) {
      const projectObj = await db.all(sql`SELECT workspace_id FROM seo_projects WHERE id = ${projectId}`).catch(() => []);
      cwId = (projectObj as any)?.[0]?.workspace_id || workspaceId;
    }

    const assignmentId = randomUUID();
    await db.insert(teamAssignments).values({
      id: assignmentId,
      tenantId,
      workspaceId: cwId,
      userId: teamMemberId,
      teamMemberId,
      clientId: clientId || null,
      projectId: projectId || null,
      campaignId: projectId || null,
      assignedBy: adminUser.id,
      status: status || 'active'
    });

    return res.status(201).json({ success: true, message: 'Assignment created successfully', assignmentId });
  } catch (err: any) {
    console.error('POST team-assignments:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/team-assignments/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || 'default-tenant';

    await db.delete(teamAssignments).where(
      and(
        eq(teamAssignments.id, id),
        eq(teamAssignments.tenantId, tenantId)
      )
    );

    return res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    console.error('DELETE team-assignments:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
