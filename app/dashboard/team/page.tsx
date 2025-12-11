import { TeamPageClient } from '@/components/team-page-client';
import { fetchTeamMembers } from '@/lib/team-data';
import { PageGuard } from '@/components/page-guard';

export default async function TeamPage() {
  const { team } = await fetchTeamMembers();

  return (
    <PageGuard page="team">
      <TeamPageClient team={team} />
    </PageGuard>
  );
}
