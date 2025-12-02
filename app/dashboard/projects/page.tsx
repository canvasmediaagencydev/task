import { ProjectsPageClient } from '@/components/projects-page-client';
import { fetchProjectsAndTasks } from '@/lib/projects-data';

export default async function ProjectsPage() {
  const { projects, tasks, isMock } = await fetchProjectsAndTasks();

  return <ProjectsPageClient projects={projects} tasks={tasks} isMock={isMock} />;
}
