'use client';

import { useEffect } from 'react';

import {
  fetchUnreadNotificationCount,
  mapNotificationEvent,
  NOTIFICATION_API_BASE_URL,
  NOTIFICATION_EVENT_TYPES,
} from './notificationApi';
import { useNotificationStore } from './store';

export function useNotificationSync(enabled: boolean) {
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const incrementUnreadCount = useNotificationStore((state) => state.incrementUnreadCount);
  const pushRealtimeNotification = useNotificationStore((state) => state.pushRealtimeNotification);
  const resetNotifications = useNotificationStore((state) => state.resetNotifications);

  useEffect(() => {
    if (!enabled) {
      resetNotifications();
      return undefined;
    }

    let active = true;

    const syncUnreadCount = async () => {
      try {
        const nextUnreadCount = await fetchUnreadNotificationCount();

        if (active) {
          setUnreadCount(nextUnreadCount);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    void syncUnreadCount();

    return () => {
      active = false;
    };
  }, [enabled, resetNotifications, setUnreadCount]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const eventSource = new EventSource(`${NOTIFICATION_API_BASE_URL}/api/v1/subscribe`, {
      withCredentials: true,
    });
    const handleNotification = (event: MessageEvent<string>) => {
      const notification = mapNotificationEvent(event);

      if (!notification) {
        return;
      }

      pushRealtimeNotification(notification);
      incrementUnreadCount();
    };

    NOTIFICATION_EVENT_TYPES.forEach((type) => {
      eventSource.addEventListener(type, handleNotification);
    });

    return () => {
      NOTIFICATION_EVENT_TYPES.forEach((type) => {
        eventSource.removeEventListener(type, handleNotification);
      });
      eventSource.close();
    };
  }, [enabled, incrementUnreadCount, pushRealtimeNotification]);
}
