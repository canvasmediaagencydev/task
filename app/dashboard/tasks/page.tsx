import { fetchTasks } from '@/lib/api';
import { TasksPageClient } from '@/components/tasks-page-client';
import { PageGuard } from '@/components/page-guard';

export default async function TasksPage() {
  const tasks = await fetchTasks();

  return (
    <PageGuard page="tasks">
      <TasksPageClient initialTasks={tasks} />
    </PageGuard>
  );
}
