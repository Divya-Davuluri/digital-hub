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

// --- TASKS (USER REQUESTED EXACT LOGIC) ---

router.post('/tasks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, clientName, priority } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    const { randomUUID } = await import('crypto');
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
    console.error('Create task error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details: error.message
    });
  }
});

router.get('/tasks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    const results = await db.run(sql`
      SELECT id, title, client_name as clientName,
        priority, status, due_date as dueDate,
        created_at as createdAt
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND (
        assigned_to = ${userId}
        OR created_by = ${userId}
      )
      AND (
        status IS NULL 
        OR status != 'COMPLETED'
      )
      ORDER BY created_at DESC
    `);

    const tasksList = results.rows || results;

    return res.json({
      success: true,
      tasks: tasksList || []
    });

  } catch (error: any) {
    console.error('Get tasks error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
});

router.patch('/tasks/:id/complete', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;

    await db.run(sql`
      UPDATE tasks 
      SET 
        status = 'COMPLETED',
        completed_at = ${new Date().toISOString()}
      WHERE id = ${id}
      AND (
        assigned_to = ${userId}
        OR created_by = ${userId}
      )
    `);

    return res.json({ 
      success: true,
      message: 'Task completed'
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to complete task'
    });
  }
});

// --- CAMPAIGNS ---

// GET /api/team/campaigns
router.get('/campaigns', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    console.log('=== TEAM CAMPAIGNS DEBUG ===');
    console.log('Team tenant_id:', tenantId);
    console.log('Team userId:', userId);

    // Show ALL campaigns in the same tenant as requested
    const results = await db.run(sql`
      SELECT DISTINCT
        id, name, client_name as clientName,
        client_id as clientId, status, budget,
        spend as spent, impressions, clicks,
        conversions, COALESCE(platform, channel) as platform,
        start_date as startDate, end_date as endDate, created_at as createdAt
      FROM campaigns
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `);

    const campaignsList = results.rows || results;
    
    console.log('Campaigns found:', campaignsList.length);
    if (campaignsList.length > 0) {
      console.log('First campaign:', campaignsList[0]);
    }
    console.log('============================');

    res.json({
      success: true,
      campaigns: campaignsList || []
    });
  } catch (err: any) {
    console.error('Get team campaigns error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
