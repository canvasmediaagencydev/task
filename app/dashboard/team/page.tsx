import { TeamPageClient } from '@/components/team-page-client';
import { fetchTeamMembers } from '@/lib/team-data';

export default async function TeamPage() {
  const { team } = await fetchTeamMembers();

  return <TeamPageClient team={team} />;
}
