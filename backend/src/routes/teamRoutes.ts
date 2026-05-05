import express from 'express';
import { db } from '../db';
import { clients, tasks, campaigns } from '../db/schema';
import { eq, and, inArray, desc, or, isNull, sql } from 'drizzle-orm';
import { authMiddleware, authorize, AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// --- CLIENTS ---

// GET /api/team/clients
router.get('/clients', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    const results = await db.run(sql`
      SELECT 
        id, name, email, 
        company_name as companyName, status, created_at as createdAt
      FROM clients
      WHERE tenant_id = ${tenantId}
      AND assigned_team_member_id = ${userId}
      ORDER BY created_at DESC
    `);

    const clientsList = results.rows || results;
    res.json({ success: true, clients: clientsList });
  } catch (err: any) {
    console.error('Get team clients error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

// POST /api/team/clients
router.post('/clients', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { contactPerson, companyName, contactEmail } = req.body;
    const userId = req.user.id || req.user.userId;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    if (!contactPerson || !contactEmail) {
      return res.status(400).json({ success: false, error: 'Contact person and email are required' });
    }

    const clientId = uuidv4();
    const createdAt = new Date().toISOString();

    await db.run(sql`
      INSERT INTO clients (
        id, tenant_id, name, email, company_name,
        status, assigned_team_member_id, created_at
      ) VALUES (
        ${clientId}, ${tenantId}, ${contactPerson}, ${contactEmail}, ${companyName || null},
        'active', ${userId}, ${createdAt}
      )
    `);

    res.status(201).json({
      success: true,
      client: {
        id: clientId,
        name: contactPerson,
        email: contactEmail,
        companyName: companyName || '',
        status: 'active',
        assignedTeamMemberId: userId,
        createdAt: createdAt
      }
    });
  } catch (err: any) {
    console.error('Create team client error:', err);
    res.status(500).json({ success: false, error: 'Failed to create client' });
  }
});

// --- TASKS ---

// GET /api/team/tasks
router.get('/tasks', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    console.log('Fetching tasks for:', { userId, tenantId });

    const results = await db.run(sql`
      SELECT 
        id, title, client_name as clientName,
        priority, status, due_date as dueDate,
        created_at as createdAt, completed_at as completedAt
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND (assigned_to = ${userId} OR created_by = ${userId})
      AND (status IS NULL OR status != 'COMPLETED')
      ORDER BY created_at DESC
    `);

    const tasksList = results.rows || results;
    console.log('Tasks found:', tasksList.length);
    res.json({ success: true, tasks: tasksList || [] });
  } catch (err: any) {
    console.error('Get team tasks error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// POST /api/team/tasks
router.post('/tasks', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { title, clientName, priority, dueDate } = req.body;
    const userId = req.user.id || req.user.userId;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    console.log('Create task request:', { body: req.body, userId, tenantId });

    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    const taskId = uuidv4();
    const createdAt = new Date().toISOString();

    await db.run(sql`
      INSERT INTO tasks (
        id, tenant_id, title, client_name, priority,
        status, due_date, assigned_to, created_by, created_at
      ) VALUES (
        ${taskId}, ${tenantId}, ${title}, ${clientName || null}, ${priority || 'MEDIUM'},
        'PENDING', ${dueDate || null}, ${userId}, ${userId}, ${createdAt}
      )
    `);

    console.log('Task created:', taskId);

    res.status(201).json({
      success: true,
      task: {
        id: taskId,
        title: title,
        clientName: clientName || '',
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        dueDate: dueDate || null,
        assignedTo: userId,
        createdAt: createdAt
      }
    });
  } catch (error: any) {
    console.error('Create team task error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// PATCH /api/team/tasks/:taskId/complete
router.patch('/tasks/:taskId/complete', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id || req.user.userId;

    await db.run(sql`
      UPDATE tasks 
      SET status = 'COMPLETED', completed_at = ${new Date().toISOString()}
      WHERE id = ${taskId}
      AND assigned_to = ${userId}
    `);

    res.json({ success: true, message: 'Task completed!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to complete task' });
  }
});

// --- CAMPAIGNS ---

// GET /api/team/campaigns
router.get('/campaigns', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    const assignedClients = await db.query.clients.findMany({
      where: and(
        eq(clients.tenantId, tenantId),
        eq(clients.assignedTeamMemberId, userId)
      ),
      columns: { id: true }
    });

    const clientIds = assignedClients.map(c => c.id);
    if (clientIds.length === 0) return res.json([]);

    const teamCampaigns = await db.select({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
      budget: campaigns.budget,
      clientName: clients.name,
      impressions: campaigns.impressions,
      clicks: campaigns.clicks,
      conversions: campaigns.conversions,
      spend: campaigns.spend
    })
    .from(campaigns)
    .innerJoin(clients, eq(campaigns.clientId, clients.id))
    .where(and(
      eq(campaigns.tenantId, tenantId),
      inArray(campaigns.clientId, clientIds)
    ))
    .orderBy(desc(campaigns.createdAt));

    res.json(teamCampaigns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
