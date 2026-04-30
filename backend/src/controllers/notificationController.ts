import { Response } from 'express';
import { db } from '../db';
import { notifications } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .orderBy(desc(notifications.createdAt));
    
    res.json(userNotifications);
  } catch (error) {
    console.error('[GET_NOTIFICATIONS_ERROR]', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    await db.update(notifications)
      .set({ isRead: 1 })
      .where(and(eq(notifications.id, id), eq(notifications.tenantId, tenantId)));

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('[MARK_READ_ERROR]', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

export const createNotification = async (tenantId: string, type: 'alert' | 'info' | 'success' | 'warning', message: string) => {
  try {
    await db.insert(notifications).values({
      id: uuidv4(),
      tenantId,
      type,
      message,
    });
  } catch (error) {
    console.error('[CREATE_NOTIFICATION_ERROR]', error);
  }
};
