export type TaskStatus =
  | 'backlog'
  | 'in_progress'
  | 'waiting_review'
  | 'sent_client'
  | 'feedback'
  | 'approved'
  | 'done';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskType = 'content' | 'graphic' | 'review' | 'posting' | 'vdo' | 'report' | 'motion' | 'production_plan' | 'shooting' | 'other';

export type ProjectStatus = 'active' | 'on_hold' | 'done';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface TeamMember extends User {
  role?: string;
  department?: string;
  location?: string;
  availability?: string;
  utilization?: number;
  current_projects?: number;
  focus_areas?: string[];
  position?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  notes?: string;
}

export interface ClientSummary extends Client {
  project_count?: number;
  open_tasks?: number;
  last_project?: string;
  last_activity?: string;
}

export interface Project {
  id: string;
  name: string;
  client: Client;
  status: ProjectStatus;
  sales_persons?: User[];  // Changed from sales_person to sales_persons (array)
  account_executives?: User[];  // Changed from ae to account_executives (array)
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
  assignees?: User[];  // Changed from assignee to assignees (array)
  reviewers?: User[];  // Changed from reviewer to reviewers (array)
  due_date?: string;
  month?: string;  // Month/year that this task belongs to (format: YYYY-MM-DD, first day of month)
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
