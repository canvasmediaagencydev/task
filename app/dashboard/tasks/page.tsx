import { fetchTasks } from '@/lib/api';
import { TasksPageClient } from '@/components/tasks-page-client';

export default async function TasksPage() {
  const tasks = await fetchTasks();

  return <TasksPageClient initialTasks={tasks} />;
}
