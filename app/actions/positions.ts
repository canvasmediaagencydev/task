'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/database.types';

type PositionInsert = Database['public']['Tables']['positions']['Insert'];
type PositionUpdate = Database['public']['Tables']['positions']['Update'];

export async function fetchPositions() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    return { success: false, error: 'Failed to fetch positions', data: [] };
  }
}

export async function fetchActivePositions() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to fetch active positions:', error);
    return { success: false, error: 'Failed to fetch active positions', data: [] };
  }
}

export async function createPosition(data: PositionInsert) {
  try {
    const supabase = await createClient();

    const { data: position, error } = await supabase
      .from('positions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    return { success: true, data: position };
  } catch (error) {
    console.error('Failed to create position:', error);
    return { success: false, error: 'Failed to create position' };
  }
}

export async function updatePosition(id: string, data: PositionUpdate) {
  try {
    const supabase = await createClient();

    const { data: position, error } = await supabase
      .from('positions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/team');
    return { success: true, data: position };
  } catch (error) {
    console.error('Failed to update position:', error);
    return { success: false, error: 'Failed to update position' };
  }
}

export async function deletePosition(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/team');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete position:', error);
    return { success: false, error: 'Failed to delete position' };
  }
}
