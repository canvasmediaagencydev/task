'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { Database } from '@/lib/database.types';
import { requirePermission } from '@/lib/rbac';

type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export async function createClient(data: ClientInsert) {
  try {
    await requirePermission('clients:create');

    const supabase = await createClient();

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
    await requirePermission('clients:update');

    const supabase = await createClient();

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
    await requirePermission('clients:delete');

    const supabase = await createClient();

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
