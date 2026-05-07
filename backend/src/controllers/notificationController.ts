import { Request, Response } from 'express';
import { db } from '../db';
import { notifications } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role } = req.user as any;
    
    // Notifications can be tenant-wide or workspace-specific
    const userNotifications = await db.select()
      .from(notifications)
      .where(workspaceId 
        ? and(eq(notifications.tenantId, tenantId), eq(notifications.workspaceId, workspaceId))
        : eq(notifications.tenantId, tenantId)
      )
      .orderBy(desc(notifications.createdAt));
    
    res.json(userNotifications);
  } catch (error) {
    console.error('[GET_NOTIFICATIONS_ERROR]', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user as any;

    await db.update(notifications)
      .set({ isRead: 1 })
      .where(and(eq(notifications.id, id), eq(notifications.tenantId, tenantId)));

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('[MARK_READ_ERROR]', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

export const createNotification = async (tenantId: string, workspaceId: string | null, type: 'alert' | 'info' | 'success' | 'warning', message: string) => {
  try {
    await db.insert(notifications).values({
      id: uuidv4(),
      tenantId,
      workspaceId,
      type,
      message,
    });
  } catch (error) {
    console.error('[CREATE_NOTIFICATION_ERROR]', error);
  }
};
