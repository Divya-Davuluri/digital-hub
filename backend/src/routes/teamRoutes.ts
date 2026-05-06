import express, { Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Request } from 'express';

interface AuthUser {
  id?: string;
  userId?: string;
  tenantId?: string;
  tenant_id?: string;
  tenant?: string;
  email?: string;
  role?: string;
  name?: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

const getUser = (req: AuthRequest) => {
  const user = req.user || {};
  return {
    userId: (user as AuthUser).id || 
      (user as AuthUser).userId || '',
    tenantId: 
      (user as AuthUser).tenantId || 
      (user as AuthUser).tenant_id || 
      (user as AuthUser).tenant || ''
  };
};

const router = express.Router();

// Import authMiddleware
import { authMiddleware } from '../middleware/authMiddleware';

// ════════════════════════
// TASKS ROUTES
// ════════════════════════

router.get('/tasks', authMiddleware,
  async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = getUser(req);
    
    console.log('GET /tasks tenantId:', 
      tenantId);

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
        created_at TEXT 
          DEFAULT (datetime('now')),
        completed_at TEXT
      )
    `).catch(() => {});

    const tasks = await db.all(sql`
      SELECT id, title, client_name,
        priority, status, due_date,
        created_at
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND (status IS NULL 
        OR status != 'COMPLETED')
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      tasks: tasks || []
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('GET /tasks:', err.message);
    return res.status(500).json({
      success: false,
      tasks: [],
      error: err.message
    });
  }
});

router.post('/tasks', authMiddleware,
  async (req: AuthRequest, res: Response) => {
  try {
    const { userId, tenantId } = 
      getUser(req);
    const { 
      title, 
      clientName, 
      priority 
    } = req.body || {};

    console.log('POST /tasks:', { 
      title, tenantId, userId 
    });

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    const priorityMap: 
      Record<string, string> = {
      'High Priority': 'HIGH',
      'Medium Priority': 'MEDIUM',
      'Low Priority': 'LOW',
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM',
      'LOW': 'LOW'
    };

    const normalizedPriority = 
      priorityMap[priority] || 'MEDIUM';

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
        created_at TEXT 
          DEFAULT (datetime('now')),
        completed_at TEXT
      )
    `).catch(() => {});

    const taskId = randomUUID();
    const now = new Date().toISOString();

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
        ${normalizedPriority},
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
        priority: normalizedPriority,
        status: 'PENDING',
        created_at: now
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('POST /tasks:', 
      err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.patch('/tasks/:id/complete',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = getUser(req);
    const { id } = req.params;

    await db.run(sql`
      UPDATE tasks
      SET 
        status = 'COMPLETED',
        completed_at = ${new Date()
          .toISOString()}
      WHERE id = ${id}
      AND tenant_id = ${tenantId}
    `);

    return res.json({ 
      success: true,
      message: 'Task completed'
    });

  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ════════════════════════
// CAMPAIGNS ROUTES
// ════════════════════════

router.get('/campaigns', authMiddleware,
  async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = getUser(req);

    console.log('GET /campaigns tenantId:', 
      tenantId);

    const campaigns = await db.all(sql`
      SELECT DISTINCT id, name, 
        client_name, status, budget,
        spent, impressions, clicks,
        conversions, platform,
        start_date, end_date, created_at
      FROM campaigns
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      campaigns: campaigns || []
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('GET /campaigns:', 
      err.message);
    return res.status(500).json({
      success: false,
      campaigns: [],
      error: err.message
    });
  }
});

// ════════════════════════
// CLIENTS ROUTES
// ════════════════════════

router.get('/clients', authMiddleware,
  async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = getUser(req);

    const clients = await db.all(sql`
      SELECT id, name, email, 
        company_name, status
      FROM clients
      WHERE tenant_id = ${tenantId}
      ORDER BY name ASC
    `);

    return res.json({
      success: true,
      clients: clients || []
    });

  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      clients: [],
      error: err.message
    });
  }
});

router.post('/clients', authMiddleware,
  async (req: AuthRequest, res: Response) => {
  try {
    const { userId, tenantId } = 
      getUser(req);
    const { 
      contactPerson, 
      companyName, 
      contactEmail 
    } = req.body || {};

    if (!contactPerson || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Name and email required'
      });
    }

    const clientId = randomUUID();

    await db.run(sql`
      INSERT INTO clients (
        id, tenant_id, name, email,
        company_name, status,
        assigned_team_member_id,
        created_at
      ) VALUES (
        ${clientId},
        ${tenantId},
        ${contactPerson},
        ${contactEmail},
        ${companyName || null},
        'ACTIVE',
        ${userId},
        ${new Date().toISOString()}
      )
    `);

    return res.json({
      success: true,
      client: {
        id: clientId,
        name: contactPerson,
        email: contactEmail,
        companyName: companyName || '',
        status: 'ACTIVE'
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
