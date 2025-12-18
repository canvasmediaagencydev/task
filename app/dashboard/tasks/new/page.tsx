import { NewTaskForm } from '@/components/new-task-form';
import { fetchActiveUsers, fetchActiveProjects } from '@/lib/api';

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const params = await searchParams;
  const [users, projects] = await Promise.all([
    fetchActiveUsers(),
    fetchActiveProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Task</h1>
        <p className="text-muted-foreground">
          Add a new task to your project
        </p>
      </div>

      <NewTaskForm
        users={users}
        projects={projects}
        initialProjectId={params.projectId}
      />
    </div>
  );
}
