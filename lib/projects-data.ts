import { Project, Task } from '@/lib/types';
import { createClient } from '@/lib/supabase-server';
import { fetchTasks } from '@/lib/api';
import { Database } from '@/lib/database.types';

type SupabaseProjectRow = Database['public']['Tables']['projects']['Row'] & {
  client?: {
    id: string;
    name: string;
    company_name?: string | null;
    contact_person?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  sales_person?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    is_active?: boolean | null;
  } | null;
  ae?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    is_active?: boolean | null;
  } | null;
};

function mapProject(row: SupabaseProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    status: (row.status || 'active') as Project['status'],
    client: row.client || {
      id: row.client_id || 'client-missing',
      name: row.client?.name || 'Unknown Client',
    },
    sales_person: row.sales_person || undefined,
    ae: row.ae || undefined,
    start_date: row.start_date || undefined,
    end_date: row.end_date || undefined,
    confirmed_at: row.confirmed_at || undefined,
  };
}

export async function fetchProjectsAndTasks(): Promise<{
  projects: Project[];
  tasks: Task[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      sales_person:users!projects_sales_person_id_fkey(*),
      ae:users!projects_ae_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }

  const projects = (data || []).map(mapProject);
  const tasks = await fetchTasks();

  return { projects, tasks };
}

export async function fetchProjectDetail(projectId: string) {
  const { projects, tasks } = await fetchProjectsAndTasks();
  const project = projects.find((p) => p.id === projectId);
  const projectTasks = project
    ? tasks.filter((task) => task.project?.id === project.id)
    : [];

  return { project, tasks: projectTasks };
}
