'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';

export async function fetchNotifications(limit = 50) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized', data: [] };
    }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        related_user:users!notifications_related_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    return { success: false, error: message, data: [] };
  }
}

export async function fetchUnreadCount() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, count: 0 };
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return { success: false, count: 0 };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
    return { success: false, error: message };
  }
}

export async function markAllAsRead() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark all as read';
    return { success: false, error: message };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete notification:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete notification';
    return { success: false, error: message };
  }
}
