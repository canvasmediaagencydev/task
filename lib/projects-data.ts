import { Project, Task } from '@/lib/types';
import { createClient } from '@/lib/supabase-server';
import { fetchTasks } from '@/lib/api';
import type { Database } from '@/database.types';

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
    client: row.client ? {
      id: row.client.id,
      name: row.client.name,
      company_name: row.client.company_name ?? undefined,
      contact_person: row.client.contact_person ?? undefined,
      email: row.client.email ?? undefined,
      phone: row.client.phone ?? undefined,
    } : {
      id: row.client_id || 'client-missing',
      name: 'Unknown Client',
    },
    sales_person: row.sales_person ? {
      id: row.sales_person.id,
      email: row.sales_person.email,
      full_name: row.sales_person.full_name,
      avatar_url: row.sales_person.avatar_url ?? undefined,
      is_active: row.sales_person.is_active ?? true,
    } : undefined,
    ae: row.ae ? {
      id: row.ae.id,
      email: row.ae.email,
      full_name: row.ae.full_name,
      avatar_url: row.ae.avatar_url ?? undefined,
      is_active: row.ae.is_active ?? true,
    } : undefined,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { projects: [], tasks: [] };
  }

  const tasks = await fetchTasks();

  const projectIds = Array.from(
    new Set(tasks.map((task) => task.project?.id).filter((id): id is string => Boolean(id)))
  );

  if (projectIds.length === 0) {
    return { projects: [], tasks };
  }

  const baseQuery = supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      sales_person:users!projects_sales_person_id_fkey(*),
      ae:users!projects_ae_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  const orFilters = [
    `created_by.eq.${user.id}`,
    `ae_id.eq.${user.id}`,
    `sales_person_id.eq.${user.id}`,
  ];

  if (projectIds.length > 0) {
    const formattedIds = projectIds.map((id) => `"${id}"`).join(',');
    orFilters.push(`id.in.(${formattedIds})`);
  }

  const query = orFilters.length > 0
    ? baseQuery.or(orFilters.join(','))
    : baseQuery.eq('created_by', user.id);

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }

  const projects = (data || [])
    .map(mapProject)
    .filter((project, index, arr) =>
      arr.findIndex((p) => p.id === project.id) === index
    );

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
