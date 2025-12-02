export type TaskStatus =
  | 'backlog'
  | 'in_progress'
  | 'waiting_review'
  | 'sent_client'
  | 'feedback'
  | 'approved'
  | 'done';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskType = 'content' | 'graphic' | 'review' | 'posting' | 'other';

export type ProjectStatus = 'active' | 'on_hold' | 'done';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  company_name?: string;
}

export interface Project {
  id: string;
  name: string;
  client: Client;
  status: ProjectStatus;
  sales_person?: User;
  ae?: User;
  start_date?: string;
  end_date?: string;
  confirmed_at?: string;
}

export interface Task {
  id: string;
  project: Project;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: User;
  reviewer?: User;
  due_date?: string;
  completed_at?: string;
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  entity_type: 'task' | 'project';
  entity_id: string;
  action: string;
  description: string;
  created_by: User;
  created_at: string;
}

export interface DashboardStats {
  total_tasks: number;
  active_projects: number;
  completion_rate: number;
  overdue_tasks: number;
}

export interface TaskStatusCount {
  status: TaskStatus;
  count: number;
}
