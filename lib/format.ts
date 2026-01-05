import { format, formatDistanceToNow } from 'date-fns';
import { TaskStatus, TaskPriority, TaskType } from './types';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    backlog: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    waiting_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    sent_client: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    feedback: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  };
  return colors[status];
}

export function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    waiting_review: 'Waiting Review',
    sent_client: 'Sent to Client',
    feedback: 'Feedback',
    approved: 'Approved',
    done: 'Done',
  };
  return labels[status];
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
  };
  return colors[priority];
}

export function getPriorityLabel(priority: TaskPriority): string {
  const labels: Record<TaskPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority];
}

export function getTypeColor(type: TaskType): string {
  const colors: Record<TaskType, string> = {
    content: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    graphic: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400',
    review: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400',
    posting: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400',
    vdo: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
    report: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
    motion: 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[type];
}

export function getTypeLabel(type: TaskType): string {
  const labels: Record<TaskType, string> = {
    content: 'Content',
    graphic: 'Graphic',
    review: 'Review',
    posting: 'Posting',
    vdo: 'VDO',
    report: 'Report',
    motion: 'Motion',
    other: 'Other',
  };
  return labels[type];
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
