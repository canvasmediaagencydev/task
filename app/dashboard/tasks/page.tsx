import { fetchTasks } from '@/lib/api';
import { TasksPageClient } from '@/components/tasks-page-client';
import { PageGuard } from '@/components/page-guard';
import { createClient } from '@/lib/supabase-server';

export default async function TasksPage() {
  const tasks = await fetchTasks();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <PageGuard page="tasks">
      <TasksPageClient initialTasks={tasks} currentUserId={user?.id} />
    </PageGuard>
  );
}
