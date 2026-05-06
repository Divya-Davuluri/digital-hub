/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = express.Router();

// Import authMiddleware
import { authMiddleware } from '../middleware/authMiddleware';

// ════════════════════════
// TASKS ROUTES
// ════════════════════════

router.get('/tasks', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      (req as any).user?.tenantId ||
      (req as any).user?.tenant_id || '';
    const userId = 
      (req as any).user?.id ||
      (req as any).user?.userId || '';

    console.log('GET /tasks tenantId:', tenantId);

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

  } catch (error: any) {
    console.error('GET /tasks:', error.message);
    return res.status(500).json({
      success: false,
      tasks: [],
      error: error.message
    });
  }
});

router.post('/tasks',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      (req as any).user?.tenantId ||
      (req as any).user?.tenant_id || '';
    const userId = 
      (req as any).user?.id ||
      (req as any).user?.userId || '';

    const { 
      title, clientName, priority 
    } = req.body || {};

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title required'
      });
    }

    const priorityMap: Record<string, string> = {
      'High Priority': 'HIGH',
      'Medium Priority': 'MEDIUM',
      'Low Priority': 'LOW',
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM',
      'LOW': 'LOW'
    };

    const taskId = randomUUID();
    const now = new Date().toISOString();

    await db.run(sql`
      INSERT INTO tasks (
        id, tenant_id, title,
        client_name, priority,
        status, assigned_to,
        created_by, created_at
      ) VALUES (
        ${taskId}, ${tenantId},
        ${title.trim()},
        ${clientName || null},
        ${priorityMap[priority] || 'MEDIUM'},
        'PENDING',
        ${userId}, ${userId}, ${now}
      )
    `);

    return res.status(201).json({
      success: true,
      task: {
        id: taskId,
        title: title.trim(),
        client_name: clientName || '',
        priority: priorityMap[priority] || 'MEDIUM',
        status: 'PENDING',
        created_at: now
      }
    });

  } catch (error: any) {
    console.error('POST tasks error:', error.message);
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
    const tenantId = 
      (req as any).user?.tenantId ||
      (req as any).user?.tenant_id || '';
    const userId = 
      (req as any).user?.id ||
      (req as any).user?.userId || '';
      
    const { id } = req.params;

    await db.run(sql`
      UPDATE tasks
      SET 
        status = 'COMPLETED',
        completed_at = ${new Date().toISOString()}
      WHERE id = ${id}
      AND tenant_id = ${tenantId}
    `);

    return res.json({ 
      success: true,
      message: 'Task completed'
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ════════════════════════
// CAMPAIGNS ROUTES
// ════════════════════════

router.get('/campaigns', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      (req as any).user?.tenantId ||
      (req as any).user?.tenant_id || '';
    const userId = 
      (req as any).user?.id ||
      (req as any).user?.userId || '';

    console.log('GET /campaigns tenantId:', tenantId);

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

  } catch (error: any) {
    console.error('GET /campaigns:', error.message);
    return res.status(500).json({
      success: false,
      campaigns: [],
      error: error.message
    });
  }
});

router.post('/campaigns',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      (req as any).user?.tenantId ||
      (req as any).user?.tenant_id || '';
    const userId = 
      (req as any).user?.id ||
      (req as any).user?.userId || '';

    const { 
      name, budget, clientName,
      clientId, platform 
    } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name required'
      });
    }

    const campaignId = randomUUID();
    const now = new Date().toISOString();

    await db.run(sql`
      INSERT INTO campaigns (
        id, tenant_id, name,
        client_id, client_name,
        status, budget,
        platform,
        assigned_team_member_id,
        created_by, created_at
      ) VALUES (
        ${campaignId},
        ${tenantId},
        ${name.trim()},
        ${clientId || null},
        ${clientName || null},
        'ACTIVE',
        ${Number(budget) || 0},
        ${platform || 'Meta'},
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
        status: 'ACTIVE',
        budget: Number(budget) || 0,
        platform: platform || 'Meta',
        created_at: now
      }
    });

  } catch (error: any) {
    console.error('POST campaigns error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ════════════════════════
// CLIENTS ROUTES
// ════════════════════════

router.get('/clients', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      (req as any).user?.tenantId ||
      (req as any).user?.tenant_id || '';
    const userId = 
      (req as any).user?.id ||
      (req as any).user?.userId || '';

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

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      clients: [],
      error: error.message
    });
  }
});

router.post('/clients', authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      (req as any).user?.tenantId ||
      (req as any).user?.tenant_id || '';
    const userId = 
      (req as any).user?.id ||
      (req as any).user?.userId || '';

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

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Team routes loaded:');
console.log('  - GET  /api/team/tasks');
console.log('  - POST /api/team/tasks');
console.log('  - GET  /api/team/campaigns');
console.log('  - POST /api/team/campaigns');
console.log('  - GET  /api/team/clients');
console.log('  - POST /api/team/clients');

export default router;
