import { TeamMember } from '@/lib/types';
import { createClient } from '@/lib/supabase-server';

export async function fetchTeamMembers(): Promise<{ team: TeamMember[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      assigned_tasks:tasks!tasks_assignee_id_fkey(id, status, project_id),
      reviewing_tasks:tasks!tasks_reviewer_id_fkey(id, status)
    `)
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    console.error('Failed to fetch team members:', error);
    throw error;
  }

  const team: TeamMember[] = (data || []).map((member: any) => {
    const assignedTasks = member.assigned_tasks || [];
    const activeProjects = new Set(
      assignedTasks
        .filter((t: any) => t.status !== 'done' && t.project_id)
        .map((t: any) => t.project_id)
    ).size;

    const totalTasks = assignedTasks.length + (member.reviewing_tasks?.length || 0);
    const utilization = totalTasks > 0 ? Math.min(100, Math.round((totalTasks / 10) * 100)) : 0;

    return {
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      avatar_url: member.avatar_url || undefined,
      is_active: member.is_active ?? true,
      role: 'Team Member',
      department: 'General',
      location: 'Bangkok',
      availability: activeProjects > 0 ? `${activeProjects} active projects` : 'Available',
      utilization,
      current_projects: activeProjects,
      focus_areas: assignedTasks.length > 0 ? ['Campaign Ops'] : [],
    };
  });

  return { team };
}
