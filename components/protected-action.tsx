'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { PermissionString } from '@/lib/rbac-types';

interface ProtectedActionProps {
  permission: PermissionString;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that shows/hides children based on user permissions
 *
 * @example
 * <ProtectedAction permission="projects:create">
 *   <Button>Create Project</Button>
 * </ProtectedAction>
 */
export function ProtectedAction({ permission, children, fallback = null }: ProtectedActionProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <>{fallback}</>;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ProtectedAnyProps {
  permissions: PermissionString[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Shows children if user has ANY of the specified permissions
 */
export function ProtectedAny({ permissions, children, fallback = null }: ProtectedAnyProps) {
  const { hasAnyPermission, loading } = usePermissions();

  if (loading) {
    return <>{fallback}</>;
  }

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ProtectedAllProps {
  permissions: PermissionString[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Shows children if user has ALL of the specified permissions
 */
export function ProtectedAll({ permissions, children, fallback = null }: ProtectedAllProps) {
  const { hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return <>{fallback}</>;
  }

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
