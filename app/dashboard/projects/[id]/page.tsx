import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { ProjectDetailClient } from '@/components/project-detail-client';
import type { Database } from '@/database.types';
import type { Project } from '@/lib/types';
import { mapTaskRowToTask, mapSupabaseUser, TaskRowWithRelations } from '@/lib/task-mapper';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [projectResult, tasksResult] = await Promise.all([
    supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        sales_person:users!projects_sales_person_id_fkey(*),
        ae:users!projects_ae_id_fkey(*),
        pipeline_stage:pipeline_stages(*)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignee_id_fkey(*),
        reviewer:users!tasks_reviewer_id_fkey(*),
        created_by:users!tasks_created_by_fkey(*)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  type ProjectRow = Database['public']['Tables']['projects']['Row'] & {
    client: Database['public']['Tables']['clients']['Row'] | null;
    sales_person: Database['public']['Tables']['users']['Row'] | null;
    ae: Database['public']['Tables']['users']['Row'] | null;
    pipeline_stage: Database['public']['Tables']['pipeline_stages']['Row'] | null;
  };

  const project = projectResult.data as ProjectRow;

  const fallbackProject: Project = {
    id: project.id,
    name: project.name,
    client: {
      id: project.client?.id ?? '',
      name: project.client?.name ?? project.name,
      contact_person: project.client?.contact_person ?? undefined,
      email: project.client?.email ?? undefined,
      phone: project.client?.phone ?? undefined,
      company_name: project.client?.company_name ?? undefined,
      notes: project.client?.notes ?? undefined,
    },
    status: (project.status as Project['status']) ?? 'active',
    sales_person: mapSupabaseUser(project.sales_person),
    ae: mapSupabaseUser(project.ae),
    start_date: project.start_date ?? undefined,
    end_date: project.end_date ?? undefined,
    confirmed_at: project.confirmed_at ?? undefined,
  };

  const taskRows = (tasksResult.data || []) as TaskRowWithRelations[];
  const normalizedTasks = taskRows.map((task) =>
    mapTaskRowToTask(task, { fallbackProject })
  );

  return <ProjectDetailClient project={project} tasks={normalizedTasks} />;
}
