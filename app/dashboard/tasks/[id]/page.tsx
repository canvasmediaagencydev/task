import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TaskDetailClient } from '@/components/task-detail-client';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [taskResult, attachmentsResult] = await Promise.all([
    supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, name),
        assignee:users!tasks_assignee_id_fkey(id, full_name, avatar_url),
        created_by_user:users!tasks_created_by_fkey(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('attachments')
      .select('*, created_by:users(full_name, avatar_url)')
      .eq('entity_type', 'task')
      .eq('entity_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (taskResult.error || !taskResult.data) {
    console.error('Error fetching task:', taskResult.error);
    notFound();
  }

  const attachments = attachmentsResult.data || [];

  return <TaskDetailClient task={taskResult.data} attachments={attachments} />;
}
