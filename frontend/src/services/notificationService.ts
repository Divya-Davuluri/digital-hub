import apiCall from '@/lib/api';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  return apiCall('/notifications');
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  return apiCall(`/notifications/${id}/read`, {
    method: 'POST',
  });
};
