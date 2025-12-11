import { TeamMember } from '@/lib/types';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/database.types';

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

  type TeamMemberRow = Database['public']['Tables']['users']['Row'] & {
    assigned_tasks: Database['public']['Tables']['tasks']['Row'][];
    reviewing_tasks: Database['public']['Tables']['tasks']['Row'][];
  };

  const team: TeamMember[] = (data || []).map((member) => {
    const typedMember = member as TeamMemberRow;
    const assignedTasks = typedMember.assigned_tasks || [];
    const activeProjects = new Set(
      assignedTasks
        .filter((task) => task.status !== 'done' && task.project_id)
        .map((task) => task.project_id as string)
    ).size;

    const totalTasks = assignedTasks.length + (typedMember.reviewing_tasks?.length || 0);
    const utilization = totalTasks > 0 ? Math.min(100, Math.round((totalTasks / 10) * 100)) : 0;

    return {
      id: typedMember.id,
      email: typedMember.email,
      full_name: typedMember.full_name,
      avatar_url: typedMember.avatar_url || undefined,
      is_active: typedMember.is_active ?? true,
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
