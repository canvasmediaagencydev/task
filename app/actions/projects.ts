'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/database.types';
import { requirePageAccess } from '@/lib/page-access';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export async function createProject(
  data: ProjectInsert & {
    sales_person_ids?: string[];
    ae_ids?: string[];
  }
) {
  try {
    await requirePageAccess('projects');

    const supabase = await createClient();

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Extract multi-user fields
    const { sales_person_ids, ae_ids, ...projectData } = data;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert sales persons into junction table
    if (sales_person_ids && sales_person_ids.length > 0) {
      const { error: salesError } = await supabase
        .from('project_sales_persons')
        .insert(
          sales_person_ids.map(userId => ({
            project_id: project.id,
            user_id: userId,
          }))
        );

      if (salesError) {
        console.error('Error inserting sales persons:', salesError);
      }
    }

    // Insert account executives into junction table
    if (ae_ids && ae_ids.length > 0) {
      const { error: aeError } = await supabase
        .from('project_account_executives')
        .insert(
          ae_ids.map(userId => ({
            project_id: project.id,
            user_id: userId,
          }))
        );

      if (aeError) {
        console.error('Error inserting account executives:', aeError);
      }
    }

    revalidatePath('/dashboard/projects');
    return { success: true, data: project };
  } catch (error) {
    console.error('Failed to create project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

export async function updateProject(
  id: string,
  data: ProjectUpdate & {
    sales_person_ids?: string[];
    ae_ids?: string[];
  }
) {
  try {
    await requirePageAccess('projects');

    const supabase = await createClient();

    // Extract multi-user fields
    const { sales_person_ids, ae_ids, ...projectData } = data;

    const { data: project, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update sales persons: delete existing and insert new ones
    if (sales_person_ids !== undefined) {
      // Delete existing sales persons
      await supabase
        .from('project_sales_persons')
        .delete()
        .eq('project_id', id);

      // Insert new sales persons
      if (sales_person_ids.length > 0) {
        const { error: salesError } = await supabase
          .from('project_sales_persons')
          .insert(
            sales_person_ids.map(userId => ({
              project_id: id,
              user_id: userId,
            }))
          );

        if (salesError) {
          console.error('Error updating sales persons:', salesError);
        }
      }
    }

    // Update account executives: delete existing and insert new ones
    if (ae_ids !== undefined) {
      // Delete existing account executives
      await supabase
        .from('project_account_executives')
        .delete()
        .eq('project_id', id);

      // Insert new account executives
      if (ae_ids.length > 0) {
        const { error: aeError } = await supabase
          .from('project_account_executives')
          .insert(
            ae_ids.map(userId => ({
              project_id: id,
              user_id: userId,
            }))
          );

        if (aeError) {
          console.error('Error updating account executives:', aeError);
        }
      }
    }

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
