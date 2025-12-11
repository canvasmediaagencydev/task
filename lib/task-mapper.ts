import type { Database } from '@/database.types';
import type { Client, Project, Task, TaskPriority, TaskStatus, TaskType, User } from '@/lib/types';

export type TaskRowWithRelations = Database['public']['Tables']['tasks']['Row'] & {
  project?: (Database['public']['Tables']['projects']['Row'] & {
    client?: Database['public']['Tables']['clients']['Row'] | null;
  }) | null;
  assignee?: Database['public']['Tables']['users']['Row'] | null;
  reviewer?: Database['public']['Tables']['users']['Row'] | null;
  created_by_user?: Database['public']['Tables']['users']['Row'] | null;
};

export function mapSupabaseUser(
  row?: Database['public']['Tables']['users']['Row'] | null
): User | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    avatar_url: row.avatar_url ?? undefined,
    is_active: row.is_active ?? true,
  };
}

function mapClient(row?: Database['public']['Tables']['clients']['Row'] | null): Client {
  return {
    id: row?.id ?? '',
    name: row?.name ?? 'Client',
    contact_person: row?.contact_person ?? undefined,
    email: row?.email ?? undefined,
    phone: row?.phone ?? undefined,
    company_name: row?.company_name ?? undefined,
    notes: row?.notes ?? undefined,
  };
}

function mapProject(
  row?: (Database['public']['Tables']['projects']['Row'] & {
    client?: Database['public']['Tables']['clients']['Row'] | null;
  }) | null,
  fallback?: Project
): Project {
  const client = row?.client ? mapClient(row.client) : fallback?.client ?? mapClient();
  return {
    id: row?.id ?? fallback?.id ?? '',
    name: row?.name ?? fallback?.name ?? 'Project',
    client,
    status: (row?.status as Project['status']) ?? fallback?.status ?? 'active',
    sales_person: fallback?.sales_person,
    ae: fallback?.ae,
    start_date: row?.start_date ?? fallback?.start_date,
    end_date: row?.end_date ?? fallback?.end_date,
    confirmed_at: row?.confirmed_at ?? fallback?.confirmed_at,
  };
}

export function mapTaskRowToTask(
  row: TaskRowWithRelations,
  options: { fallbackProject?: Project } = {}
): Task {
  const assignee = mapSupabaseUser(row.assignee);
  const reviewer = mapSupabaseUser(row.reviewer);
  const createdBy =
    mapSupabaseUser(row.created_by_user) ??
    (row.created_by
      ? {
          id: row.created_by,
          email: '',
          full_name: 'Unknown',
          avatar_url: undefined,
          is_active: true,
        }
      : {
          id: 'unknown',
          email: '',
          full_name: 'Unknown',
          avatar_url: undefined,
          is_active: true,
        });

  const project = mapProject(row.project, options.fallbackProject);

  return {
    id: row.id,
    project,
    title: row.title,
    description: row.description ?? undefined,
    type: (row.type as TaskType) ?? 'other',
    status: (row.status as TaskStatus) ?? 'backlog',
    priority: (row.priority as TaskPriority) ?? 'normal',
    assignee,
    reviewer,
    due_date: row.due_date ?? undefined,
    completed_at: row.completed_at ?? undefined,
    created_by: createdBy,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}
