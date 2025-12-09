import { Database } from './database.types';

// Database table types
export type Role = Database['public']['Tables']['roles']['Row'];
export type RoleInsert = Database['public']['Tables']['roles']['Insert'];
export type RoleUpdate = Database['public']['Tables']['roles']['Update'];

export type Permission = Database['public']['Tables']['permissions']['Row'];
export type PermissionInsert = Database['public']['Tables']['permissions']['Insert'];

export type RolePermission = Database['public']['Tables']['role_permissions']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];

// Extended types with relationships
export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type UserWithRole = {
  userId: string;
  role: RoleWithPermissions | null;
};

// Permission string type for better type safety
export type PermissionString =
  // Projects
  | 'projects:create'
  | 'projects:read'
  | 'projects:update'
  | 'projects:delete'
  // Clients
  | 'clients:create'
  | 'clients:read'
  | 'clients:update'
  | 'clients:delete'
  // Tasks
  | 'tasks:create'
  | 'tasks:read'
  | 'tasks:update'
  | 'tasks:delete'
  // Team
  | 'team:read'
  | 'team:update'
  // Roles
  | 'roles:read'
  | 'roles:manage'
  // Users
  | 'users:assign_roles';

// Helper types
export type Resource = 'projects' | 'clients' | 'tasks' | 'team' | 'roles' | 'users';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign_roles';
