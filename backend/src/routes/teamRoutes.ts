import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { authMiddleware, authorize, AuthRequest } from '../middleware/authMiddleware';
import { randomUUID } from 'crypto';

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

// --- TASKS (STEP 4 - BULLETPROOF HANDLERS) ---

router.post('/tasks', authMiddleware,
  async (req: any, res) => {
  console.log('POST /tasks called');
  
  try {
    const body = req.body || {};
    const title = body.title || 
      body.taskTitle || '';
    const clientName = body.clientName || 
      body.client_name || '';
    const priorityRaw = body.priority || 
      'MEDIUM';
    
    const userId = req.user?.id || 
      req.user?.userId || 'unknown';
    const tenantId = req.user?.tenantId || 
      req.user?.tenant_id || 
      req.user?.id || '';

    console.log('Creating task:', {
      title, clientName, priorityRaw,
      userId, tenantId
    });

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'No tenant found'
      });
    }

    const priorityMap: Record<string, string> 
      = {
      'High Priority': 'HIGH',
      'Medium Priority': 'MEDIUM',
      'Low Priority': 'LOW',
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM', 
      'LOW': 'LOW'
    };
    const priority = 
      priorityMap[priorityRaw] || 'MEDIUM';

    const taskId = randomUUID();
    const now = new Date().toISOString();

    try {
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          tenant_id TEXT,
          title TEXT NOT NULL,
          client_name TEXT,
          priority TEXT DEFAULT 'MEDIUM',
          status TEXT DEFAULT 'PENDING',
          due_date TEXT,
          assigned_to TEXT,
          created_by TEXT,
          created_at TEXT,
          completed_at TEXT
        )
      `);
    } catch (tableErr) {
      console.log('Table already exists');
    }

    await db.run(sql`
      INSERT INTO tasks (
        id, tenant_id, title,
        client_name, priority,
        status, assigned_to,
        created_by, created_at
      ) VALUES (
        ${taskId},
        ${tenantId},
        ${title.trim()},
        ${clientName || null},
        ${priority},
        'PENDING',
        ${userId},
        ${userId},
        ${now}
      )
    `);

    console.log('Task created:', taskId);

    return res.status(201).json({
      success: true,
      task: {
        id: taskId,
        title: title.trim(),
        client_name: clientName || '',
        priority: priority,
        status: 'PENDING',
        created_at: now
      }
    });

  } catch (error: any) {
    console.error('POST /tasks ERROR:', 
      error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

router.get('/tasks', authMiddleware,
  async (req: any, res) => {
  console.log('GET /tasks called');
  
  try {
    const tenantId = req.user?.tenantId || 
      req.user?.tenant_id || 
      req.user?.id || '';

    console.log('Getting tasks for tenant:', 
      tenantId);

    try {
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          tenant_id TEXT,
          title TEXT NOT NULL,
          client_name TEXT,
          priority TEXT DEFAULT 'MEDIUM',
          status TEXT DEFAULT 'PENDING',
          due_date TEXT,
          assigned_to TEXT,
          created_by TEXT,
          created_at TEXT,
          completed_at TEXT
        )
      `);
    } catch (e) {
      console.log('Table exists');
    }

    const tasks = await db.all(sql`
      SELECT id, title, client_name,
        priority, status, due_date,
        created_at
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND (
        status IS NULL 
        OR status != 'COMPLETED'
      )
      ORDER BY created_at DESC
    `);

    console.log('Tasks found:', 
      tasks?.length || 0);

    return res.json({
      success: true,
      tasks: tasks || []
    });

  } catch (error: any) {
    console.error('GET /tasks ERROR:', 
      error.message);
    return res.status(500).json({
      success: false,
      tasks: [],
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
