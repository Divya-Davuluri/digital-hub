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
    const userId = req.user?.id || req.user?.userId;
    const tenantId = req.user?.tenantId || req.user?.tenant_id || req.tenantId;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

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

// --- TASKS ---

router.post('/tasks', authMiddleware, async (req: any, res) => {
  try {
    const body = req.body || {};
    const title = body.title || body.taskTitle || '';
    const clientName = body.clientName || body.client_name || '';
    const priorityRaw = body.priority || 'MEDIUM';
    
    const userId = req.user?.id || req.user?.userId || 'unknown';
    const tenantId = req.user?.tenantId || req.user?.tenant_id || req.tenantId;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'No tenant context found' });
    }

    const priorityMap: Record<string, string> = {
      'High Priority': 'HIGH',
      'Medium Priority': 'MEDIUM',
      'Low Priority': 'LOW',
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM', 
      'LOW': 'LOW'
    };
    const priority = priorityMap[priorityRaw] || 'MEDIUM';

    const taskId = randomUUID();
    const now = new Date().toISOString();

    // Ensure table exists
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
    `).catch(() => {});

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

    res.status(201).json({
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
    console.error('POST /tasks ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tasks', authMiddleware, async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id || req.tenantId;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

    // Ensure table exists
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
    `).catch(() => {});

    const tasks = await db.all(sql`
      SELECT id, title, client_name,
        priority, status, due_date,
        created_at
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND (status IS NULL OR status != 'COMPLETED')
      ORDER BY created_at DESC
    `);

    res.json({ success: true, tasks: tasks || [] });
  } catch (error: any) {
    console.error('GET /tasks ERROR:', error.message);
    res.status(500).json({ success: false, tasks: [], error: error.message });
  }
});

// PATCH complete task
router.patch('/tasks/:id/complete', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || req.user?.tenant_id || req.tenantId;

    await db.run(sql`
      UPDATE tasks
      SET status = 'COMPLETED',
          completed_at = ${new Date().toISOString()}
      WHERE id = ${id}
      AND tenant_id = ${tenantId}
    `);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- CAMPAIGNS ---

router.get('/campaigns', authMiddleware, async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id || req.tenantId;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

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

    res.json({ success: true, campaigns: campaigns || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, campaigns: [], error: error.message });
  }
});

export default router;
