'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create admin client with service role (bypasses RLS)
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create user profile in public.users table
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email!,
      full_name: fullName,
    });

    if (profileError) {
      return { error: profileError.message };
    }

    // Assign default page access (dashboard and tasks)
    if (data.user) {
      const defaultPages = ['dashboard', 'tasks'];
      const pageAccessRecords = defaultPages.map(page => ({
        user_id: data.user!.id,
        page_name: page
      }));

      await supabase.from('user_page_access').insert(pageAccessRecords);
    }
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function createUserByAdmin(
  email: string,
  password: string,
  fullName: string,
  positionId?: string
) {
  'use server';

  const supabase = await createClient();

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Create admin client using service role key (bypasses RLS)
    const supabaseAdmin = createAdminClient();

    // Check if user with this email already exists in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    if (existingUser) {
      // Check if this user exists in public.users
      const { data: publicUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', existingUser.id)
        .single();

      if (!publicUser) {
        // Orphaned auth user - clean it up
        console.log(`Cleaning up orphaned auth user: ${email}`);
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      } else {
        // User exists in both tables
        return { success: false, error: 'A user with this email already exists' };
      }
    }

    // Use Admin API to create user without affecting current session
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // Create user profile in public.users table using admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: authData.user.email!,
      full_name: fullName,
      position_id: positionId || null,
      is_active: true,
    });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // If user profile creation fails, clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: `Failed to create user profile: ${profileError.message}` };
    }

    // Note: Page access will be set by admin in Settings UI

    revalidatePath('/dashboard/settings');
    return {
      success: true,
      data: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return { success: false, error: message };
  }
}

export async function deleteUserByAdmin(userId: string) {
  'use server';

  const supabase = await createClient();

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: 'Unauthorized' };
  }

  // Prevent deleting yourself
  if (currentUser.id === userId) {
    return { success: false, error: 'Cannot delete your own account' };
  }

  try {
    // Create admin client using service role key (bypasses RLS)
    const supabaseAdmin = createAdminClient();

    // Delete related records first to avoid foreign key constraint errors

    // Delete user's page access
    await supabaseAdmin.from('user_page_access').delete().eq('user_id', userId);

    // Delete user's notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

    // Delete user's comments
    await supabaseAdmin.from('task_comments').delete().eq('user_id', userId);

    // Update tasks to set null for this user (don't delete tasks)
    await supabaseAdmin.from('tasks').update({ assignee_id: null }).eq('assignee_id', userId);
    await supabaseAdmin.from('tasks').update({ reviewer_id: null }).eq('reviewer_id', userId);

    // Update projects to set null for this user
    await supabaseAdmin.from('projects').update({ sales_person_id: null }).eq('sales_person_id', userId);
    await supabaseAdmin.from('projects').update({ ae_id: null }).eq('ae_id', userId);

    // Delete user from users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('Error deleting user from users table:', userError);
      return { success: false, error: `Database error: ${userError.message}` };
    }

    // Delete from auth.users using admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return { success: false, error: `Failed to delete user from auth: ${authError.message}` };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    return { success: false, error: message };
  }
}
