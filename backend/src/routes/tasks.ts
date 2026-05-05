import express from 'express';
import { db } from '../db';
import { tasks } from '../db/schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/tasks',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const { 
      title, 
      clientName, 
      priority,
      dueDate 
    } = req.body;

    const userId = req.user.id;
    const tenantId = req.user.tenantId 
      || req.user.tenant_id;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    const taskId = uuidv4();

    await db.run(sql`
      INSERT INTO tasks (
        id,
        tenant_id,
        title,
        client_name,
        priority,
        status,
        due_date,
        assigned_to,
        created_by,
        created_at
      ) VALUES (
        ${taskId},
        ${tenantId},
        ${title},
        ${clientName || null},
        ${priority || 'MEDIUM'},
        'PENDING',
        ${dueDate || null},
        ${userId},
        ${userId},
        ${new Date().toISOString()}
      )
    `);

    return res.json({
      success: true,
      task: {
        id: taskId,
        title: title,
        clientName: clientName || '',
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        dueDate: dueDate || null,
        assignedTo: userId,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Create task error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details: error.message
    });
  }
});

router.get('/tasks',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId
      || req.user.tenant_id;

    const results = await db.run(sql`
      SELECT 
        id, title, client_name as clientName,
        priority, status, due_date as dueDate,
        created_at as createdAt, completed_at as completedAt
      FROM tasks
      WHERE tenant_id = ${tenantId}
      AND assigned_to = ${userId}
      AND status != 'COMPLETED'
      ORDER BY created_at DESC
    `);

    const tasksList = results.rows || results;

    return res.json({
      success: true,
      tasks: tasksList || []
    });

  } catch (error: any) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      details: error.message
    });
  }
});

router.patch('/tasks/:taskId/complete',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    await db.run(sql`
      UPDATE tasks 
      SET 
        status = 'COMPLETED',
        completed_at = ${new Date().toISOString()}
      WHERE id = ${taskId}
      AND assigned_to = ${userId}
    `);

    return res.json({ 
      success: true,
      message: 'Task completed!'
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to complete task'
    });
  }
});

export default router;
