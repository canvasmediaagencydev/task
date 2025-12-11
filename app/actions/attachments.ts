'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/database.types';

type AttachmentInsert = Database['public']['Tables']['attachments']['Insert'];

export async function createAttachment(data: AttachmentInsert) {
  try {
    const supabase = await createClient();

    const { data: attachment, error } = await supabase
      .from('attachments')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Revalidate the relevant paths
    if (data.entity_type === 'task') {
      revalidatePath(`/dashboard/tasks/${data.entity_id}`);
    } else if (data.entity_type === 'project') {
      revalidatePath(`/dashboard/projects/${data.entity_id}`);
    }

    return { success: true, data: attachment };
  } catch (error) {
    console.error('Failed to create attachment:', error);
    return { success: false, error: 'Failed to create attachment' };
  }
}

export async function deleteAttachment(id: string, entityType: string, entityId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('attachments').delete().eq('id', id);

    if (error) throw error;

    // Revalidate the relevant paths
    if (entityType === 'task') {
      revalidatePath(`/dashboard/tasks/${entityId}`);
    } else if (entityType === 'project') {
      revalidatePath(`/dashboard/projects/${entityId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    return { success: false, error: 'Failed to delete attachment' };
  }
}

export async function fetchAttachments(entityType: string, entityId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('attachments')
      .select('*, created_by:users(full_name, avatar_url)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to fetch attachments:', error);
    return { success: false, error: 'Failed to fetch attachments', data: [] };
  }
}
