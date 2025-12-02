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

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(id, name),
      assignee:users!tasks_assignee_id_fkey(id, full_name, avatar_url),
      created_by_user:users!tasks_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching task:', error);
    notFound();
  }

  if (!task) {
    console.log('Task not found for ID:', id);
    notFound();
  }

  return <TaskDetailClient task={task} />;
}
