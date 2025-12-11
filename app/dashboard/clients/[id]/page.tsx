import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { ClientDetailClient } from '@/components/client-detail-client';
import type { Database } from '@/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type PipelineStageRow = Database['public']['Tables']['pipeline_stages']['Row'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectWithRelations = ProjectRow & {
  sales_person: UserRow | null;
  ae: UserRow | null;
  pipeline_stage: PipelineStageRow | null;
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [clientResult, projectsResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('projects')
      .select(`
        *,
        sales_person:users!projects_sales_person_id_fkey(*),
        ae:users!projects_ae_id_fkey(*),
        pipeline_stage:pipeline_stages(*)
      `)
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (clientResult.error || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data as ClientRow;
  const projects = (projectsResult.data || []) as ProjectWithRelations[];

  return <ClientDetailClient client={client} projects={projects} />;
}
