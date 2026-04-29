import { Response } from 'express';
import { db } from '../db';
import { tasks } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    console.log(`📡 FETCHING TASKS - Tenant: ${tenantId}`);

    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.tenantId, tenantId),
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });

    console.log(`✅ SUCCESS - Found ${allTasks.length} tasks`);
    res.json(allTasks);
  } catch (err: any) {
    console.error('[GET_TASKS_ERROR]', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, assignedTo } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    console.log(`📝 CREATING TASK - User: ${userId}, Tenant: ${tenantId}`);

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newTask = await db.insert(tasks).values({
      id: uuidv4(),
      tenantId,
      title,
      description,
      priority: priority || 'medium',
      status: 'todo',
      assignedTo: assignedTo || userId,
      createdBy: userId,
    }).returning();

    console.log(`✅ SUCCESS - Task saved:`, newTask[0].id);
    res.status(201).json(newTask[0]);
  } catch (err: any) {
    console.error('[CREATE_TASK_ERROR]', err);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;

    await db.update(tasks)
      .set({ status })
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));

    res.json({ message: 'Task updated' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update task' });
  }
};
