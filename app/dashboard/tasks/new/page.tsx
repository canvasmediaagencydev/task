import { NewTaskForm } from '@/components/new-task-form';

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Task</h1>
        <p className="text-muted-foreground">
          Add a new task to your project
        </p>
      </div>

      <NewTaskForm />
    </div>
  );
}
