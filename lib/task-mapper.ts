import type { Database } from '@/database.types';
import type { Client, Project, Task, TaskPriority, TaskStatus, TaskType, User } from '@/lib/types';

export type TaskRowWithRelations = Database['public']['Tables']['tasks']['Row'] & {
  project?: (Database['public']['Tables']['projects']['Row'] & {
    client?: Database['public']['Tables']['clients']['Row'] | null;
    project_sales_persons?: Array<{
      users: Database['public']['Tables']['users']['Row'] | null;
    }>;
    project_account_executives?: Array<{
      users: Database['public']['Tables']['users']['Row'] | null;
    }>;
  }) | null;
  assignee?: Database['public']['Tables']['users']['Row'] | null;
  reviewer?: Database['public']['Tables']['users']['Row'] | null;
  task_assignees?: Array<{
    users: Database['public']['Tables']['users']['Row'] | null;
  }>;
  task_reviewers?: Array<{
    users: Database['public']['Tables']['users']['Row'] | null;
  }>;
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
    project_sales_persons?: Array<{
      users: Database['public']['Tables']['users']['Row'] | null;
    }>;
    project_account_executives?: Array<{
      users: Database['public']['Tables']['users']['Row'] | null;
    }>;
  }) | null,
  fallback?: Project
): Project {
  const client = row?.client ? mapClient(row.client) : fallback?.client ?? mapClient();

  // Map sales persons array
  const sales_persons = row?.project_sales_persons
    ?.map(item => mapSupabaseUser(item.users))
    .filter((u): u is User => Boolean(u)) ?? fallback?.sales_persons;

  // Map account executives array
  const account_executives = row?.project_account_executives
    ?.map(item => mapSupabaseUser(item.users))
    .filter((u): u is User => Boolean(u)) ?? fallback?.account_executives;

  return {
    id: row?.id ?? fallback?.id ?? '',
    name: row?.name ?? fallback?.name ?? 'Project',
    client,
    status: (row?.status as Project['status']) ?? fallback?.status ?? 'active',
    sales_persons,
    account_executives,
    start_date: row?.start_date ?? fallback?.start_date,
    end_date: row?.end_date ?? fallback?.end_date,
    confirmed_at: row?.confirmed_at ?? fallback?.confirmed_at,
  };
}

export function mapTaskRowToTask(
  row: TaskRowWithRelations,
  options: { fallbackProject?: Project } = {}
): Task {
  // Map assignees array (prefer task_assignees junction table, fallback to old assignee field)
  const assignees = row.task_assignees && row.task_assignees.length > 0
    ? row.task_assignees
        .map(item => mapSupabaseUser(item.users))
        .filter((u): u is User => Boolean(u))
    : (row.assignee ? [mapSupabaseUser(row.assignee)].filter((u): u is User => Boolean(u)) : undefined);

  // Map reviewers array (prefer task_reviewers junction table, fallback to old reviewer field)
  const reviewers = row.task_reviewers && row.task_reviewers.length > 0
    ? row.task_reviewers
        .map(item => mapSupabaseUser(item.users))
        .filter((u): u is User => Boolean(u))
    : (row.reviewer ? [mapSupabaseUser(row.reviewer)].filter((u): u is User => Boolean(u)) : undefined);

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
    assignees,
    reviewers,
    due_date: row.due_date ?? undefined,
    month: row.month ?? undefined,
    completed_at: row.completed_at ?? undefined,
    created_by: createdBy,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}
