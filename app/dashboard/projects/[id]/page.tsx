import { notFound } from 'next/navigation';
import { fetchProjectDetail } from '@/lib/projects-data';
import { ProjectDetailClient } from '@/components/project-detail-client';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, tasks, isMock } = await fetchProjectDetail(id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} tasks={tasks} isMock={isMock} />;
}
