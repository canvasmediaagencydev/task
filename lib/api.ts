import { createClient } from './supabase-server';
import { Task, User, Activity, DashboardStats, TaskStatusCount, TaskStatus } from './types';
import type { Database } from '@/database.types';
import { mapTaskRowToTask, mapSupabaseUser, TaskRowWithRelations } from './task-mapper';

// Fetch all tasks with related data
export async function fetchTasks(): Promise<Task[]> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Query user_visible_tasks view (now without auth.uid() filter)
  // Type cast to 'any' to avoid TypeScript depth errors with views
  const { data: tasksData, error } = await (supabase
    .from('user_visible_tasks' as any)
    .select(`
      *,
      project:projects(
        *,
        client:clients(*),
        project_sales_persons(users(*)),
        project_account_executives(users(*))
      ),
      assignee:users!tasks_assignee_id_fkey(*),
      reviewer:users!tasks_reviewer_id_fkey(*),
      task_assignees(users(*)),
      task_reviewers(users(*)),
      created_by_user:users!tasks_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false }) as any);

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  // Filter tasks where user is involved (assignee, reviewer, or creator)
  const filteredTasks = (tasksData || []).filter((task: any) => {
    return (
      task.assignee_id === user.id ||
      task.reviewer_id === user.id ||
      task.created_by === user.id ||
      (task.assignee_user_ids && task.assignee_user_ids.includes(user.id)) ||
      (task.reviewer_user_ids && task.reviewer_user_ids.includes(user.id))
    );
  });

  const taskRows = filteredTasks as TaskRowWithRelations[];
  return taskRows.map((task) => mapTaskRowToTask(task));
}

// Fetch dashboard stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      total_tasks: 0,
      active_projects: 0,
      completion_rate: 0,
      overdue_tasks: 0,
    };
  }

  const { data: tasksData, error } = await (supabase
    .from('user_visible_tasks' as any)
    .select(`
      id,
      status,
      due_date,
      assignee_id,
      reviewer_id,
      created_by,
      assignee_user_ids,
      reviewer_user_ids,
      project:projects(id, status)
    `) as any);

  if (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      total_tasks: 0,
      active_projects: 0,
      completion_rate: 0,
      overdue_tasks: 0,
    };
  }

  type TaskWithProjectStatus = Database['public']['Tables']['tasks']['Row'] & {
    project: Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'status'> | null;
    assignee_user_ids?: string[];
    reviewer_user_ids?: string[];
  };

  // Filter tasks where user is involved
  const allTasks = (tasksData || []) as TaskWithProjectStatus[];
  const tasks = allTasks.filter((task: any) => {
    return (
      task.assignee_id === user.id ||
      task.reviewer_id === user.id ||
      task.created_by === user.id ||
      (task.assignee_user_ids && task.assignee_user_ids.includes(user.id)) ||
      (task.reviewer_user_ids && task.reviewer_user_ids.includes(user.id))
    );
  });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const now = new Date().toISOString();
  const overdueTasks = tasks.filter(
    (task) => task.due_date && task.due_date < now && task.status !== 'done'
  ).length;
  const activeProjects = Array.from(
    new Set(
      tasks
        .filter((task) => task.project?.status === 'active' && task.project?.id)
        .map((task) => task.project?.id as string)
    )
  ).length;

  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return {
    total_tasks: totalTasks,
    active_projects: activeProjects,
    completion_rate: completionRate,
    overdue_tasks: overdueTasks,
  };
}

// Fetch task status counts
export async function fetchTaskStatusCounts(): Promise<TaskStatusCount[]> {
  const supabase = await createClient();
  const statuses: TaskStatus[] = [
    'backlog',
    'in_progress',
    'waiting_review',
    'sent_client',
    'feedback',
    'approved',
    'done',
  ];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return statuses.map((status) => ({ status, count: 0 }));
  }

  const { data, error } = await (supabase
    .from('user_visible_tasks' as any)
    .select('status, assignee_id, reviewer_id, created_by, assignee_user_ids, reviewer_user_ids') as any);

  if (error) {
    console.error('Error fetching task status counts:', error);
    return statuses.map((status) => ({ status, count: 0 }));
  }

  // Filter tasks where user is involved
  const filteredData = (data || []).filter((task: any) => {
    return (
      task.assignee_id === user.id ||
      task.reviewer_id === user.id ||
      task.created_by === user.id ||
      (task.assignee_user_ids && task.assignee_user_ids.includes(user.id)) ||
      (task.reviewer_user_ids && task.reviewer_user_ids.includes(user.id))
    );
  });

  const statusTotals = filteredData.reduce((acc: Record<TaskStatus, number>, task: any) => {
    const status = (task.status as TaskStatus) ?? 'backlog';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  return statuses.map((status) => ({ status, count: statusTotals[status] || 0 }));
}

// Fetch recent activities
export async function fetchRecentActivities(): Promise<Activity[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: userTasks, error: tasksError } = await (supabase
    .from('user_visible_tasks' as any)
    .select('id, assignee_id, reviewer_id, created_by, assignee_user_ids, reviewer_user_ids') as any);

  if (tasksError) {
    console.error('Error fetching user tasks for activities:', tasksError);
    return [];
  }

  // Filter tasks where user is involved
  const filteredTasks = (userTasks || []).filter((task: any) => {
    return (
      task.assignee_id === user.id ||
      task.reviewer_id === user.id ||
      task.created_by === user.id ||
      (task.assignee_user_ids && task.assignee_user_ids.includes(user.id)) ||
      (task.reviewer_user_ids && task.reviewer_user_ids.includes(user.id))
    );
  });

  const taskIds = filteredTasks.map((task: any) => task.id).filter(Boolean);
  const orFilters = [`created_by.eq.${user.id}`];

  if (taskIds.length > 0) {
    const inClause = taskIds.map((id: string) => `"${id}"`).join(',');
    orFilters.push(`and(entity_type.eq.task,entity_id.in.(${inClause}))`);
  }

  const query = supabase
    .from('activity_logs')
    .select(`
      *,
      created_by_user:users!activity_logs_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data, error } = orFilters.length > 0
    ? await query.or(orFilters.join(','))
    : await query.eq('created_by', user.id);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  type ActivityRow = Database['public']['Tables']['activity_logs']['Row'] & {
    created_by_user: Database['public']['Tables']['users']['Row'] | null;
  };

  return (data || []).map((log) => {
    const typedLog = log as ActivityRow;
    return {
      id: typedLog.id,
      entity_type: typedLog.entity_type as 'task' | 'project',
      entity_id: typedLog.entity_id,
      action: typedLog.action,
      description: typedLog.description || '',
      created_by:
        mapSupabaseUser(typedLog.created_by_user) ?? {
          id: typedLog.created_by ?? 'unknown',
          email: '',
          full_name: 'Unknown',
          avatar_url: undefined,
          is_active: true,
        },
      created_at: typedLog.created_at ?? new Date().toISOString(),
    } satisfies Activity;
  });
}

// Fetch active users for assignment dropdown
export async function fetchActiveUsers(): Promise<User[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data || [])
    .map((user) => mapSupabaseUser(user))
    .filter((user): user is User => Boolean(user));
}

export async function fetchActiveProjects(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data || [];
}

// Update task status
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}
