'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch('/api/tasks', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        console.error('Failed to load tasks', payload?.error);
        return;
      }

      setTasks((payload?.tasks || []) as Task[]);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const subscribeToTasks = useCallback(
    (userId: string) => {
      const channel = supabase
        .channel('tasks:all')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tasks',
          },
          () => {
            void loadTasks({ silent: true });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks',
          },
          () => {
            void loadTasks({ silent: true });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'tasks',
          },
          () => {
            void loadTasks({ silent: true });
          }
        )
        .subscribe();

      // Subscribe to user_task_positions for position changes (reordering)
      const positionsChannel = supabase
        .channel(`positions:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_task_positions',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void loadTasks({ silent: true });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(positionsChannel);
      };
    },
    [loadTasks]
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
        setTasks([]);
        return;
      }

      await loadTasks();

      if (!isMounted) {
        return;
      }

      unsubscribe = subscribeToTasks(user.id);
    }

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadTasks, subscribeToTasks]);

  return {
    tasks,
    loading,
    refresh: () => void loadTasks(),
  };
}
