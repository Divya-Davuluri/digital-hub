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

// --- TASKS (STEP 4 & 7 - REFINED LOGIC) ---

// GET tasks
router.get('/tasks', authMiddleware,
  async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId
      || req.user?.tenant_id;

    const tasks = await db.all(sql`
      SELECT id, title, client_name,
        priority, status, due_date,
        created_at
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND status != 'COMPLETED'
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      tasks: tasks || []
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      tasks: [],
      error: error.message
    });
  }
});

// POST create task
router.post('/tasks', authMiddleware,
  async (req: any, res) => {
  try {
    // STEP 6 - ADD TEST LOG
    console.log('POST /api/team/tasks HIT');
    console.log('Body:', req.body);
    console.log('User:', req.user?.id);

    const { title, clientName, priority } = req.body;
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    // STEP 7 - NORMALIZE PRIORITY
    const priorityMap: {[key: string]: string} = {
      'High Priority': 'HIGH',
      'Medium Priority': 'MEDIUM',
      'Low Priority': 'LOW',
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM',
      'LOW': 'LOW'
    };
    const normalizedPriority = priorityMap[priority] || 'MEDIUM';

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
        ${normalizedPriority},
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
        client_name: clientName || '',
        priority: normalizedPriority,
        status: 'PENDING',
        created_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Create task error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH complete task
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

// --- CAMPAIGNS ---

router.get('/campaigns', authMiddleware,
  async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId
      || req.user?.tenant_id;

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

    return res.json({
      success: true,
      campaigns: campaigns || []
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      campaigns: [],
      error: error.message
    });
  }
});

export default router;
