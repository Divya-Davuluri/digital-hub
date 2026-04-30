import { apiFetch } from '@/lib/api';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  return apiFetch('/notifications');
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  return apiFetch(`/notifications/${id}/read`, {
    method: 'POST',
  });
};
