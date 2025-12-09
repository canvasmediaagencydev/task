import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { ProjectDetailClient } from '@/components/project-detail-client';

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

  const project = projectResult.data;
  const tasks = tasksResult.data || [];

  return <ProjectDetailClient project={project} tasks={tasks} />;
}
