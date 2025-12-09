'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { requirePermission } from '@/lib/rbac';
import { RoleInsert, RoleUpdate } from '@/lib/rbac-types';

/**
 * Fetch all roles with their permissions
 */
export async function fetchRoles() {
  try {
    await requirePermission('roles:read');

    const supabase = await createClient();

    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesError) throw rolesError;

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      (roles || []).map(async (role) => {
        const { data: rolePermissions } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', role.id);

        const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || [];

        if (permissionIds.length === 0) {
          return { ...role, permissions: [] };
        }

        const { data: permissions } = await supabase
          .from('permissions')
          .select('*')
          .in('id', permissionIds);

        return { ...role, permissions: permissions || [] };
      })
    );

    return { success: true, data: rolesWithPermissions };
  } catch (error: any) {
    console.error('Failed to fetch roles:', error);
    return { success: false, error: error.message || 'Failed to fetch roles' };
  }
}

/**
 * Fetch all available permissions
 */
export async function fetchPermissions() {
  try {
    await requirePermission('roles:read');

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource, action');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Failed to fetch permissions:', error);
    return { success: false, error: error.message || 'Failed to fetch permissions' };
  }
}

/**
 * Create a new role
 */
export async function createRole(
  name: string,
  description: string | null,
  permissionIds: string[]
) {
  try {
    await requirePermission('roles:manage');

    const supabase = await createClient();

    // Create role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({ name, description })
      .select()
      .single();

    if (roleError) throw roleError;

    // Add permissions to role
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) => ({
        role_id: role.id,
        permission_id: permissionId,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    revalidatePath('/dashboard/settings');
    return { success: true, data: role };
  } catch (error: any) {
    console.error('Failed to create role:', error);
    return { success: false, error: error.message || 'Failed to create role' };
  }
}

/**
 * Update an existing role
 */
export async function updateRole(
  roleId: string,
  name: string,
  description: string | null,
  permissionIds: string[]
) {
  try {
    await requirePermission('roles:manage');

    const supabase = await createClient();

    // Update role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', roleId)
      .select()
      .single();

    if (roleError) throw roleError;

    // Delete existing permissions
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) throw deleteError;

    // Add new permissions
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    revalidatePath('/dashboard/settings');
    return { success: true, data: role };
  } catch (error: any) {
    console.error('Failed to update role:', error);
    return { success: false, error: error.message || 'Failed to update role' };
  }
}

/**
 * Delete a role (only if not assigned to any users)
 */
export async function deleteRole(roleId: string) {
  try {
    await requirePermission('roles:manage');

    const supabase = await createClient();

    // Check if role is assigned to any users
    const { data: userRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role_id', roleId)
      .limit(1);

    if (checkError) throw checkError;

    if (userRoles && userRoles.length > 0) {
      return {
        success: false,
        error: 'Cannot delete role that is assigned to users',
      };
    }

    // Delete role permissions first
    const { error: permError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (permError) throw permError;

    // Delete role
    const { error: roleError } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (roleError) throw roleError;

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete role:', error);
    return { success: false, error: error.message || 'Failed to delete role' };
  }
}

/**
 * Assign a role to a user
 */
export async function assignUserRole(userId: string, roleId: string) {
  try {
    await requirePermission('users:assign_roles');

    const supabase = await createClient();

    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role_id: roleId })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId });

      if (error) throw error;
    }

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/team');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to assign user role:', error);
    return { success: false, error: error.message || 'Failed to assign user role' };
  }
}

/**
 * Remove a user's role
 */
export async function removeUserRole(userId: string) {
  try {
    await requirePermission('users:assign_roles');

    const supabase = await createClient();

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/team');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to remove user role:', error);
    return { success: false, error: error.message || 'Failed to remove user role' };
  }
}

/**
 * Fetch all users with their roles
 */
export async function fetchUsersWithRoles() {
  try {
    await requirePermission('users:assign_roles');

    const supabase = await createClient();

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (usersError) throw usersError;

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      (users || []).map(async (user) => {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role_id, roles(*)')
          .eq('user_id', user.id)
          .single();

        return {
          ...user,
          role: userRole?.roles || null,
          role_id: userRole?.role_id || null,
        };
      })
    );

    return { success: true, data: usersWithRoles };
  } catch (error: any) {
    console.error('Failed to fetch users with roles:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch users with roles',
    };
  }
}
