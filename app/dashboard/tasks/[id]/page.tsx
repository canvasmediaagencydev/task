import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TaskDetailClient } from '@/components/task-detail-client';
import { getMockTask } from '@/lib/mock-task';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) {
    // Mock view when Supabase env vars aren't set
    return <TaskDetailClient task={getMockTask(id)} />;
  }

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
    // Fall back to mock task if the query fails locally
    return <TaskDetailClient task={getMockTask(id)} />;
  }

  if (!task) {
    console.log('Task not found for ID:', id);
    notFound();
  }

  return <TaskDetailClient task={task} />;
}
