"use client";

import { useRouter } from 'next/navigation';
import { Project, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProjectsTable } from '@/components/projects-table';

interface ProjectsPageClientProps {
  projects: Project[];
  tasks: Task[];
  isMock?: boolean;
}

export function ProjectsPageClient({ projects, tasks, isMock }: ProjectsPageClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects Overview</h1>
          <p className="text-muted-foreground">
            Track project health, owners, and delivery status across every engagement.
          </p>
          {isMock && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing mock project data until Supabase is wired up.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/tasks/new?type=project')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Project
          </Button>
          <Button onClick={() => router.push('/dashboard/tasks/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <ProjectsTable
        projects={projects}
        tasks={tasks}
        onSelectProject={(project) => router.push(`/dashboard/projects/${project.id}`)}
      />
    </div>
  );
}
