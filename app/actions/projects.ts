'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/database.types';
import { requirePageAccess } from '@/lib/page-access';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export async function createProject(data: ProjectInsert) {
  try {
    await requirePageAccess('projects');

    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/projects');
    return { success: true, data: project };
  } catch (error) {
    console.error('Failed to create project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

export async function updateProject(id: string, data: ProjectUpdate) {
  try {
    await requirePageAccess('projects');

    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from('projects')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${id}`);
    return { success: true, data: project };
  } catch (error) {
    console.error('Failed to update project:', error);
    return { success: false, error: 'Failed to update project' };
  }
}

export async function deleteProject(id: string) {
  try {
    await requirePageAccess('projects');

    const supabase = await createClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}

export async function fetchPipelineStages() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch pipeline stages:', error);
    return { success: false, error: 'Failed to fetch pipeline stages', data: [] };
  }
}
