import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteNotification,
  getNotificationUnreadCount,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/notifications/NotificationAPI';
const NOTIFICATION_QUERY_KEY = ['notifications'];
const UNREAD_COUNT_QUERY_KEY = ['notification-unread-count'];

export const useNotifications = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const [visibleCount, setVisibleCount] = useState(10);

  const notificationsQuery = useQuery({
    queryKey: [...NOTIFICATION_QUERY_KEY],
    queryFn: () => getNotifications({ limit: visibleCount, offset: 0 }),
    enabled,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 10000,
  });

  const unreadCountQuery = useQuery({
    queryKey: [...UNREAD_COUNT_QUERY_KEY],
    queryFn: getNotificationUnreadCount,
    enabled,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 10000,
  });

  const notifications = useMemo(() => notificationsQuery.data?.data ?? [], [notificationsQuery.data]);
  const unreadCount = unreadCountQuery.data?.count ?? 0;

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const markAsRead = useCallback(async (id: number) => {
    await markNotificationAsRead(id);
    await refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    await refresh();
  }, [refresh]);

  const removeNotification = useCallback(async (id: number) => {
    await deleteNotification(id);
    await refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    isError: notificationsQuery.isError || unreadCountQuery.isError,
    refresh,
    markAsRead,
    markAllAsRead,
    removeNotification,
    visibleCount,
    setVisibleCount,
  };
};
