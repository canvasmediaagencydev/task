'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/database.types';
import { requirePageAccess } from '@/lib/page-access';

type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export async function createClient(data: ClientInsert) {
  try {
    await requirePageAccess('clients');

    const supabase = await createSupabaseClient();

    const { data: client, error } = await supabase
      .from('clients')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    return { success: true, data: client };
  } catch (error) {
    console.error('Failed to create client:', error);
    return { success: false, error: 'Failed to create client' };
  }
}

export async function updateClient(id: string, data: ClientUpdate) {
  try {
    await requirePageAccess('clients');

    const supabase = await createSupabaseClient();

    const { data: client, error } = await supabase
      .from('clients')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${id}`);
    return { success: true, data: client };
  } catch (error) {
    console.error('Failed to update client:', error);
    return { success: false, error: 'Failed to update client' };
  }
}

export async function deleteClient(id: string) {
  try {
    await requirePageAccess('clients');

    const supabase = await createSupabaseClient();

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete client:', error);
    return { success: false, error: 'Failed to delete client' };
  }
}
