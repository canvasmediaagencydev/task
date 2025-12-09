import { createClient } from './supabase-server';
import { PermissionString, RoleWithPermissions } from './rbac-types';

// Cache for user permissions per request
const permissionCache = new Map<string, Set<string>>();

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: No authenticated user');
  }

  return user;
}

/**
 * Get user's role with all permissions
 */
export async function getUserRole(userId: string): Promise<RoleWithPermissions | null> {
  const supabase = await createClient();

  // Get user's role
  const { data: userRole, error: userRoleError } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId)
    .single();

  if (userRoleError || !userRole) {
    return null;
  }

  // Get role with permissions
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .eq('id', userRole.role_id)
    .single();

  if (roleError || !role) {
    return null;
  }

  // Get role permissions
  const { data: rolePermissions, error: permError } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', role.id);

  if (permError) {
    return { ...role, permissions: [] };
  }

  const permissionIds = rolePermissions.map((rp) => rp.permission_id);

  if (permissionIds.length === 0) {
    return { ...role, permissions: [] };
  }

  // Get permission details
  const { data: permissions, error: permsError } = await supabase
    .from('permissions')
    .select('*')
    .in('id', permissionIds);

  if (permsError) {
    return { ...role, permissions: [] };
  }

  return {
    ...role,
    permissions: permissions || [],
  };
}

/**
 * Get all permissions for a user (cached per request)
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  // Check cache first
  if (permissionCache.has(userId)) {
    return permissionCache.get(userId)!;
  }

  const roleWithPermissions = await getUserRole(userId);

  if (!roleWithPermissions) {
    const emptySet = new Set<string>();
    permissionCache.set(userId, emptySet);
    return emptySet;
  }

  const permissionSet = new Set(
    roleWithPermissions.permissions.map((p) => p.name)
  );

  permissionCache.set(userId, permissionSet);
  return permissionSet;
}

/**
 * Check if current user has a specific permission (returns boolean)
 */
export async function hasPermission(permission: PermissionString): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const permissions = await getUserPermissions(user.id);
    return permissions.has(permission);
  } catch {
    return false;
  }
}

/**
 * Require permission - throws error if user doesn't have permission
 */
export async function requirePermission(permission: PermissionString): Promise<void> {
  const user = await getCurrentUser();
  const permissions = await getUserPermissions(user.id);

  if (!permissions.has(permission)) {
    throw new Error(`Unauthorized: Missing permission '${permission}'`);
  }
}

/**
 * Clear permission cache (useful for testing or after role changes)
 */
export function clearPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<RoleWithPermissions | null> {
  const user = await getCurrentUser();
  return getUserRole(user.id);
}

/**
 * Check if user has any of the given permissions
 */
export async function hasAnyPermission(
  permissions: PermissionString[]
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const userPermissions = await getUserPermissions(user.id);

    return permissions.some((permission) => userPermissions.has(permission));
  } catch {
    return false;
  }
}

/**
 * Check if user has all of the given permissions
 */
export async function hasAllPermissions(
  permissions: PermissionString[]
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const userPermissions = await getUserPermissions(user.id);

    return permissions.every((permission) => userPermissions.has(permission));
  } catch {
    return false;
  }
}
