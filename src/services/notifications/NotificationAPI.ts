import { api } from '@/services/api';
import type { NotificationItem, NotificationListResponse, UnreadCountResponse } from '@/services/notifications/NotificationTypes';

export const getNotifications = async (params?: { limit?: number; offset?: number }) => {
  const response = await api.get<NotificationListResponse>('/notifications', { params });
  return response.data;
};

export const getNotificationUnreadCount = async () => {
  const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: number) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const getNotificationRedirectPath = (notification: NotificationItem) => {
  if (notification.magang?.id || notification.type.startsWith("MAGANG_")) {
    return "/magang/dashboard";
  }

  if (notification.task?.id && notification.board?.id) {
    return `/manajementugasdigital/board/${notification.board.id}?task=${notification.task.id}`;
  }

  if (notification.board?.id) {
    return `/manajementugasdigital/board/${notification.board.id}`;
  }

  return '/manajementugasdigital';
};
