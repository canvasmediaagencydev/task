'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { TaskStatus, TaskPriority, TaskType } from '@/lib/types';

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tasks')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task status:', error);
    return { error: error.message };
  }

  // Revalidate the tasks page to reflect changes
  revalidatePath('/dashboard/tasks');

  return { success: true };
}

export async function createTask(data: {
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('tasks')
    .insert({
      title: data.title,
      description: data.description || null,
      type: data.type,
      status: data.status,
      priority: data.priority,
      due_date: data.due_date || null,
      created_by: user.id,
    });

  if (error) {
    console.error('Error creating task:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/tasks');

  return { success: true };
}

export async function updateTask(taskId: string, data: {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}) {
  const supabase = await createClient();

  const updateData: any = {
    ...data,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/tasks');

  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/tasks');

  return { success: true };
}
