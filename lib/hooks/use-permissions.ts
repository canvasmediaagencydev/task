'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PermissionString, RoleWithPermissions } from '@/lib/rbac-types';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<RoleWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log('🔐 Auth User:', user?.id, authError);

        if (!user) {
          console.log('❌ No user found');
          setLoading(false);
          return;
        }

        // Get user's role
        const { data: userRole, error: userRoleError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
          .single();

        console.log('👤 User Role:', userRole, userRoleError);

        if (!userRole) {
          console.log('❌ No role assigned to user');
          setLoading(false);
          return;
        }

        // Get role with details
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('id', userRole.role_id)
          .single();

        console.log('🎭 Role:', role, roleError);

        if (!role) {
          console.log('❌ Role not found');
          setLoading(false);
          return;
        }

        // Get role permissions
        const { data: rolePermissions, error: rpError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', role.id);

        console.log('🔗 Role Permissions:', rolePermissions, rpError);

        const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || [];

        if (permissionIds.length === 0) {
          console.log('⚠️ No permissions for this role');
          setUserRole({ ...role, permissions: [] });
          setLoading(false);
          return;
        }

        // Get permission details
        const { data: permissionsData, error: permsError } = await supabase
          .from('permissions')
          .select('*')
          .in('id', permissionIds);

        console.log('✅ Permissions Data:', permissionsData, permsError);

        const roleWithPerms: RoleWithPermissions = {
          ...role,
          permissions: permissionsData || [],
        };

        setUserRole(roleWithPerms);
        setPermissions(new Set(permissionsData?.map((p) => p.name) || []));

        console.log('✅ Final permissions:', permissionsData?.map((p) => p.name));
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, []);

  const hasPermission = (permission: PermissionString): boolean => {
    return permissions.has(permission);
  };

  const hasAnyPermission = (perms: PermissionString[]): boolean => {
    return perms.some((p) => permissions.has(p));
  };

  const hasAllPermissions = (perms: PermissionString[]): boolean => {
    return perms.every((p) => permissions.has(p));
  };

  return {
    hasPermission,
    can: hasPermission, // Alias for better readability
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    loading,
    permissions: Array.from(permissions),
  };
}
