import { TeamMember } from '@/lib/types';
import { mockTeamMembers } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase-server';

const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function fetchTeamMembers(): Promise<{ team: TeamMember[]; isMock: boolean }> {
  if (!hasSupabaseEnv) {
    return { team: mockTeamMembers, isMock: true };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('users').select('*').order('full_name');

    if (error) {
      throw error;
    }

    const team: TeamMember[] = (data || []).map((member) => ({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      avatar_url: member.avatar_url || undefined,
      is_active: member.is_active ?? true,
      role: 'Team Member',
      department: 'General',
      location: 'Bangkok',
      availability: 'Schedule syncing soon',
      utilization: 68,
      current_projects: 2,
      focus_areas: ['Campaign Ops'],
    }));

    return { team, isMock: false };
  } catch (error) {
    console.error('Failed to fetch team members, falling back to mock data', error);
    return { team: mockTeamMembers, isMock: true };
  }
}
