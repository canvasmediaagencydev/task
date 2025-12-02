import { ClientSummary } from '@/lib/types';
import { mockClients, mockProjects, mockTasks } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase-server';
import { Database } from '@/lib/database.types';

const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type SupabaseClientRow = Database['public']['Tables']['clients']['Row'] & {
  projects?: {
    id: string;
    name: string;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
  }[];
};

function buildMockClients(): ClientSummary[] {
  return mockClients.map((client) => {
    const clientProjects = mockProjects.filter((project) => project.client.id === client.id);
    const clientTasks = mockTasks.filter((task) => task.project?.client?.id === client.id);
    const openTasks = clientTasks.filter((task) => task.status !== 'done').length;

    return {
      ...client,
      project_count: clientProjects.length,
      open_tasks: openTasks,
      last_project: clientProjects[0]?.name,
      last_activity: clientTasks[0]?.updated_at || 'Mock data synced',
    };
  });
}

export async function fetchClientsOverview(): Promise<{ clients: ClientSummary[]; isMock: boolean }> {
  if (!hasSupabaseEnv) {
    return { clients: buildMockClients(), isMock: true };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*, projects:projects(id, name, status, created_at, updated_at)')
      .order('name');

    if (error) {
      throw error;
    }

    const clients: ClientSummary[] = (data as SupabaseClientRow[] | null)?.map((row) => {
      const projectCount = row.projects?.length ?? 0;
      const lastProject = row.projects?.[0]?.name;

      return {
        id: row.id,
        name: row.name,
        contact_person: row.contact_person || undefined,
        email: row.email || undefined,
        phone: row.phone || undefined,
        company_name: row.company_name || undefined,
        notes: row.notes || undefined,
        project_count: projectCount,
        last_project: lastProject || undefined,
        last_activity: row.projects?.[0]?.updated_at || row.projects?.[0]?.created_at || undefined,
      };
    }) || [];

    return { clients, isMock: false };
  } catch (error) {
    console.error('Failed to fetch clients, falling back to mock data', error);
    return { clients: buildMockClients(), isMock: true };
  }
}
