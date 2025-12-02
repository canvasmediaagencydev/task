import { Task } from '@/lib/types';

// Mock task used when Supabase isn't configured yet
const baseMockTask: Task = {
  id: 'task-mock-1',
  title: 'Finalize Q3 Marketing Campaign Visuals',
  description:
    'Create and get approval on all visual assets for the upcoming campaign launch. Align every asset with the refreshed brand guidelines and deliver drafts by EOD Friday.',
  type: 'graphic',
  status: 'in_progress',
  priority: 'high',
  assignee: {
    id: 'user-alex',
    email: 'alex.johnson@example.com',
    full_name: 'Alex Johnson',
    avatar_url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex',
    is_active: true,
  },
  reviewer: {
    id: 'user-olivia',
    email: 'olivia.chen@example.com',
    full_name: 'Olivia Chen',
    avatar_url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Olivia',
    is_active: true,
  },
  due_date: '2023-12-15T00:00:00.000Z',
  completed_at: null,
  created_by: {
    id: 'user-jane',
    email: 'jane.doe@example.com',
    full_name: 'Jane Doe',
    avatar_url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Jane',
    is_active: true,
  },
  created_at: '2023-12-01T15:30:00.000Z',
  updated_at: '2023-12-10T09:00:00.000Z',
  project: {
    id: 'project-phoenix',
    name: 'Phoenix Project',
    status: 'active',
    client: {
      id: 'client-arcadia',
      name: 'Arcadia Brands',
      contact_person: 'Monica Rivers',
      email: 'monica@arcadia.co',
    },
  },
};

export function getMockTask(taskId: string): Task {
  return {
    ...baseMockTask,
    id: taskId,
  };
}
