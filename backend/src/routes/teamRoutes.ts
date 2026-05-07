/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// ════════════════════════════════
// TASKS ROUTES
// ════════════════════════════════

router.get('/tasks', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId 
      || req.user?.tenant_id 
      || '';
    
    console.log('GET /tasks - tenant:', 
      tenantId);

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
    `).catch((e: any) => {
      console.error('Tasks query error:', e);
      return [];
    });

    console.log('Tasks found:', 
      tasks?.length || 0);

    return res.json({
      success: true,
      tasks: tasks || []
    });

  } catch (error: any) {
    console.error('GET /tasks error:', 
      error.message);
    return res.status(500).json({
      success: false,
      tasks: [],
      error: error.message
    });
  }
});

router.post('/tasks', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId 
      || req.user?.tenant_id 
      || '';
    const userId = req.user?.id 
      || req.user?.userId 
      || '';

    console.log('POST /tasks called');
    console.log('tenant:', tenantId);
    console.log('user:', userId);
    console.log('body:', req.body);

    const title = req.body?.title || '';
    const clientName = 
      req.body?.clientName || 
      req.body?.client_name || '';
    const priorityRaw = 
      req.body?.priority || 'MEDIUM';

    if (!title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    const priorityMap: any = {
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
    console.error('POST /tasks error:', 
      error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.patch('/tasks/:id/complete',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId 
      || req.user?.tenant_id 
      || '';

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
      success: true 
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ════════════════════════════════
// CAMPAIGNS ROUTES
// ════════════════════════════════

router.get('/campaigns', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId 
      || req.user?.tenant_id 
      || '';
    
    const campaigns = await db.all(sql`
      SELECT DISTINCT id, name, client_name, status, budget, spent, 
        impressions, clicks, conversions, platform, start_date, end_date, created_at
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

// ════════════════════════════════
// CLIENTS ROUTES
// ════════════════════════════════

router.get('/clients', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId 
      || req.user?.tenant_id 
      || '';
    
    const clients = await db.all(sql`
      SELECT id, name, email, company_name, status
      FROM clients
      WHERE tenant_id = ${tenantId}
      ORDER BY name ASC
    `);

    return res.json({
      success: true,
      clients: clients || []
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      clients: [],
      error: error.message
    });
  }
});

console.log('=========================');
console.log('TEAM ROUTES REGISTERED:');
console.log('GET  /api/team/tasks ✓');
console.log('POST /api/team/tasks ✓');
console.log('PATCH /api/team/tasks/:id ✓');
console.log('GET  /api/team/campaigns ✓');
console.log('GET  /api/team/clients ✓');
console.log('=========================');

export default router;
