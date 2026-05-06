import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { authMiddleware, authorize, AuthRequest } from '../middleware/authMiddleware';

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

    const { v4: uuidv4 } = await import('uuid');
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

// --- TASKS (PART 2 - USER REQUESTED LOGIC) ---

router.get('/tasks', authMiddleware,
  async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId
      || req.user?.tenant_id;

    console.log('GET /tasks - userId:', userId,
      'tenantId:', tenantId);

    const tasks = await db.all(sql`
      SELECT id, title, client_name,
        priority, status, due_date,
        created_at
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND (
        assigned_to = ${userId}
        OR created_by = ${userId}
        OR tenant_id = ${tenantId}
      )
      AND status != 'COMPLETED'
      ORDER BY created_at DESC
    `);

    console.log('Tasks found:', tasks.length);

    return res.json({
      success: true,
      tasks: tasks || []
    });

  } catch (error: any) {
    console.error('GET tasks error:', 
      error.message);
    return res.status(500).json({
      success: false,
      tasks: [],
      error: error.message
    });
  }
});

router.post('/tasks', authMiddleware,
  async (req: any, res) => {
  try {
    const { title, clientName, priority } =
      req.body;
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId
      || req.user?.tenant_id;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    const { randomUUID } = await 
      import('crypto');
    const taskId = randomUUID();

    await db.run(sql`
      INSERT INTO tasks (
        id, tenant_id, title,
        client_name, priority,
        status, assigned_to,
        created_by, created_at
      ) VALUES (
        ${taskId},
        ${tenantId},
        ${title},
        ${clientName || null},
        ${priority || 'MEDIUM'},
        'PENDING',
        ${userId},
        ${userId},
        ${new Date().toISOString()}
      )
    `);

    return res.status(201).json({
      success: true,
      task: {
        id: taskId,
        title,
        clientName: clientName || '',
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('POST tasks error:',
      error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.patch('/tasks/:id/complete',
  authMiddleware,
  async (req: any, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId
      || req.user?.tenant_id;

    await db.run(sql`
      UPDATE tasks
      SET status = 'COMPLETED',
        completed_at = ${new Date()
          .toISOString()}
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

// --- CAMPAIGNS (PART 3 - USER REQUESTED LOGIC) ---

router.get('/campaigns', authMiddleware,
  async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId
      || req.user?.tenant_id;

    console.log('GET /campaigns tenantId:',
      tenantId);

    const campaigns = await db.all(sql`
      SELECT DISTINCT
        id, name, client_name,
        status, budget, spent,
        impressions, clicks,
        conversions, platform,
        start_date, end_date,
        created_at
      FROM campaigns
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `);

    console.log('Campaigns found:', 
      campaigns.length);

    return res.json({
      success: true,
      campaigns: campaigns || []
    });

  } catch (error: any) {
    console.error('GET campaigns error:',
      error.message);
    return res.status(500).json({
      success: false,
      campaigns: [],
      error: error.message
    });
  }
});

export default router;
