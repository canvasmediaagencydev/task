'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { requirePageAccess, PageName, clearPageAccessCache } from '@/lib/page-access';
import type { Database } from '@/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserWithPages = UserRow & { pages: PageName[] };

/**
 * Get all users with their page access
 */
export async function fetchUsersWithPageAccess() {
  try {
    await requirePageAccess('settings');

    const supabase = await createClient();

    // Get all active users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    // Get page access for each user
    const usersWithAccess: UserWithPages[] = await Promise.all(
      (users || []).map(async (user) => {
        const { data: access } = await supabase
          .from('user_page_access')
          .select('page_name')
          .eq('user_id', user.id);

        return {
          ...user,
          pages: (access || []).map((entry) => entry.page_name as PageName),
        };
      })
    );

    return { success: true, data: usersWithAccess };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load users';
    return { success: false, error: message };
  }
}

/**
 * Update user's page access
 */
export async function updateUserPageAccess(userId: string, pages: PageName[]) {
  try {
    await requirePageAccess('settings');

    const supabase = await createClient();

    // Delete existing access
    await supabase.from('user_page_access').delete().eq('user_id', userId);

    // Insert new access
    if (pages.length > 0) {
      const records: Database['public']['Tables']['user_page_access']['Insert'][] = pages.map((page) => ({
        user_id: userId,
        page_name: page,
      }));

      const { error } = await supabase.from('user_page_access').insert(records);

      if (error) throw error;
    }

    // Clear cache for this user
    clearPageAccessCache(userId);
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update page access';
    return { success: false, error: message };
  }
}
