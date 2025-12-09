import { ClientSummary } from '@/lib/types';
import { createClient } from '@/lib/supabase-server';
import { Database } from '@/lib/database.types';

type SupabaseClientRow = Database['public']['Tables']['clients']['Row'] & {
  projects?: {
    id: string;
    name: string;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
  }[];
};

export async function fetchClientsOverview(): Promise<{ clients: ClientSummary[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*, projects:projects(id, name, status, created_at, updated_at)')
    .order('name');

  if (error) {
    console.error('Failed to fetch clients:', error);
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

  return { clients };
}
