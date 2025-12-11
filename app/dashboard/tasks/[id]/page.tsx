import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TaskDetailClient } from '@/components/task-detail-client';
import type { Database } from '@/database.types';
import { mapTaskRowToTask, TaskRowWithRelations } from '@/lib/task-mapper';
import type { TaskComment } from '@/components/task-comments';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [taskResult, attachmentsResult, commentsResult] = await Promise.all([
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
    supabase
      .from('task_comments')
      .select(`
        *,
        user:users(
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (taskResult.error || !taskResult.data) {
    console.error('Error fetching task:', taskResult.error);
    notFound();
  }

  type AttachmentRow = Database['public']['Tables']['attachments']['Row'] & {
    created_by: Database['public']['Tables']['users']['Row'] | null;
  };

  const attachments = (attachmentsResult.data || []) as AttachmentRow[];
  const comments = (commentsResult.data || []) as TaskComment[];
  const normalizedTask = mapTaskRowToTask(taskResult.data as TaskRowWithRelations);

  return (
    <TaskDetailClient
      task={normalizedTask}
      attachments={attachments}
      initialComments={comments}
    />
  );
}
