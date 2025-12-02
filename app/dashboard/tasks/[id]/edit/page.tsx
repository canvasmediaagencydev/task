import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { EditTaskForm } from '@/components/edit-task-form';

export default async function EditTaskPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Task</h1>
        <p className="text-muted-foreground">
          Update task details
        </p>
      </div>
      <EditTaskForm task={task} />
    </div>
  );
}
