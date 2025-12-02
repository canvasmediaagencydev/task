import { createClient } from './supabase-server';
import { Task, Project, User, Activity, DashboardStats, TaskStatusCount, TaskStatus } from './types';

// Fetch all tasks with related data
export async function fetchTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data: tasksData, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(
        *,
        client:clients(*)
      ),
      assignee:users!tasks_assignee_id_fkey(*),
      reviewer:users!tasks_reviewer_id_fkey(*),
      created_by_user:users!tasks_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return (tasksData || []).map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type as Task['type'],
    status: task.status as Task['status'],
    priority: task.priority as Task['priority'],
    assignee: task.assignee,
    reviewer: task.reviewer,
    due_date: task.due_date,
    completed_at: task.completed_at,
    created_by: task.created_by_user,
    created_at: task.created_at,
    updated_at: task.updated_at,
    project: {
      id: task.project?.id || '',
      name: task.project?.name || '',
      status: task.project?.status || 'active',
      client: task.project?.client || { id: '', name: '' },
    },
  }));
}

// Fetch dashboard stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  // Get total tasks
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  // Get active projects
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get completed tasks
  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'done');

  // Get overdue tasks
  const now = new Date().toISOString();
  const { count: overdueTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .lt('due_date', now)
    .neq('status', 'done');

  const completionRate = totalTasks && totalTasks > 0
    ? Math.round(((completedTasks || 0) / totalTasks) * 100)
    : 0;

  return {
    total_tasks: totalTasks || 0,
    active_projects: activeProjects || 0,
    completion_rate: completionRate,
    overdue_tasks: overdueTasks || 0,
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

  const counts = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      return { status, count: count || 0 };
    })
  );

  return counts;
}

// Fetch recent activities
export async function fetchRecentActivities(): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      created_by_user:users!activity_logs_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  return (data || []).map((log: any) => ({
    id: log.id,
    entity_type: log.entity_type as 'task' | 'project',
    entity_id: log.entity_id,
    action: log.action,
    description: log.description || '',
    created_by: log.created_by_user,
    created_at: log.created_at,
  }));
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
