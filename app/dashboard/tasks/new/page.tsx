import { NewTaskForm } from '@/components/new-task-form';
import { fetchActiveUsers } from '@/lib/api';

export default async function NewTaskPage() {
  const users = await fetchActiveUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Task</h1>
        <p className="text-muted-foreground">
          Add a new task to your project
        </p>
      </div>

      <NewTaskForm users={users} />
    </div>
  );
}
