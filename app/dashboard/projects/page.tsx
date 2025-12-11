import { ProjectsPageClient } from '@/components/projects-page-client';
import { fetchProjectsAndTasks } from '@/lib/projects-data';
import { PageGuard } from '@/components/page-guard';

export default async function ProjectsPage() {
  const { projects, tasks } = await fetchProjectsAndTasks();

  return (
    <PageGuard page="projects">
      <ProjectsPageClient projects={projects} tasks={tasks} />
    </PageGuard>
  );
}
