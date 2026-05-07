import { Request, Response } from 'express';
import { db } from '../db';
import { tasks } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role } = req.user as any;
    const targetWorkspaceId = workspaceId || req.query.workspaceId;

    const allTasks = await db.query.tasks.findMany({
      where: targetWorkspaceId 
        ? and(eq(tasks.tenantId, tenantId), eq(tasks.workspaceId, targetWorkspaceId))
        : eq(tasks.tenantId, tenantId),
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });

    res.json(allTasks);
  } catch (err: any) {
    console.error('[GET_TASKS_ERROR]', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignedTo, workspaceId: bodyWorkspaceId } = req.body;
    const { tenantId, id: userId, workspaceId: tokenWorkspaceId } = req.user as any;
    
    const targetWorkspaceId = tokenWorkspaceId || bodyWorkspaceId;

    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!targetWorkspaceId) return res.status(400).json({ message: 'Workspace context required' });

    const newTask = {
      id: uuidv4(),
      tenantId,
      workspaceId: targetWorkspaceId,
      title,
      description,
      priority: priority || 'medium',
      status: 'todo',
      assignedTo: assignedTo || userId,
      createdBy: userId,
    };

    await db.insert(tasks).values([newTask] as any);
    res.status(201).json(newTask);
  } catch (err: any) {
    console.error('[CREATE_TASK_ERROR]', err);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user as any;

    await db.update(tasks)
      .set({ status })
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));

    res.json({ message: 'Task updated' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update task' });
  }
};
