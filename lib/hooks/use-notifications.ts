'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { playNotificationSound } from '@/lib/notification-sound';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  related_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  metadata: {
    comment_id?: string;
    task_id?: string;
  } | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const previousUnreadCountRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  type LoadOptions = {
    silent?: boolean;
  };

  const loadNotifications = useCallback(
    async (options: LoadOptions = {}) => {
      const { silent = false } = options;

      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          console.error('Failed to load notifications', payload?.error);
          return;
        }

        setNotifications((payload?.notifications || []) as NotificationItem[]);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        console.error('Failed to load unread notification count', payload?.error);
        return;
      }

      const newCount = payload?.count ?? 0;
      const previousCount = previousUnreadCountRef.current;

      // Play sound if unread count increased AND we've finished initializing
      // This prevents sound on initial page load but allows it for new notifications
      if (newCount > previousCount && isInitializedRef.current) {
        playNotificationSound();
      }

      previousUnreadCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Failed to load unread notification count', error);
    }
  }, []);

  const subscribeToNotifications = useCallback(
    (targetUserId: string) => {
      const channel = supabase
        .channel(`notifications:${targetUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${targetUserId}`,
          },
          () => {
            void loadNotifications({ silent: true });
            void loadUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${targetUserId}`,
          },
          () => {
            void loadNotifications({ silent: true });
            void loadUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${targetUserId}`,
          },
          () => {
            void loadNotifications({ silent: true });
            void loadUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [loadNotifications, loadUnreadCount]
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        setLoading(false);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      await Promise.all([loadNotifications(), loadUnreadCount()]);

      if (!isMounted) {
        return;
      }

      // Mark as initialized after first load - now we can play sounds for new notifications
      isInitializedRef.current = true;

      unsubscribe = subscribeToNotifications(user.id);
    }

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadNotifications, loadUnreadCount, subscribeToNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: () => {
      void loadNotifications();
      void loadUnreadCount();
    },
  };
}
