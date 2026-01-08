'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { TaskStatus, TaskPriority, TaskType } from '@/lib/types';
import { requirePageAccess } from '@/lib/page-access';
import type { Database } from '@/database.types';

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  await requirePageAccess('tasks');

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

  // Revalidate the tasks page and all related paths
  revalidatePath('/dashboard/tasks', 'page');
  revalidatePath('/dashboard', 'page');
  revalidatePath('/api/tasks', 'page');

  return { success: true };
}

export async function createTask(data: {
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  month?: string | null;
  assignee_id?: string | null;
  assignee_ids?: string[];
  reviewer_ids?: string[];
  project_id?: string | null;
  links?: Array<{
    title: string;
    url: string;
    provider_type: string;
  }>;
}) {
  await requirePageAccess('tasks');

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const insertData: Database['public']['Tables']['tasks']['Insert'] = {
    title: data.title,
    description: data.description || null,
    type: data.type,
    status: data.status,
    priority: data.priority,
    due_date: data.due_date || null,
    month: data.month || null,
    assignee_id: data.assignee_id || null,
    project_id: data.project_id || null,
    created_by: user.id,
  };

  const { data: task, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select()
    .single();

  if (error || !task) {
    console.error('Error creating task:', error);
    return { error: error?.message || 'Failed to create task' };
  }

  // Insert assignees into junction table
  if (data.assignee_ids && data.assignee_ids.length > 0) {
    const { error: assigneeError } = await supabase
      .from('task_assignees')
      .insert(
        data.assignee_ids.map(userId => ({
          task_id: task.id,
          user_id: userId,
        }))
      );

    if (assigneeError) {
      console.error('Error inserting assignees:', assigneeError);
    }
  }

  // Insert reviewers into junction table
  if (data.reviewer_ids && data.reviewer_ids.length > 0) {
    const { error: reviewerError } = await supabase
      .from('task_reviewers')
      .insert(
        data.reviewer_ids.map(userId => ({
          task_id: task.id,
          user_id: userId,
        }))
      );

    if (reviewerError) {
      console.error('Error inserting reviewers:', reviewerError);
    }
  }

  // Insert attachments/links
  if (data.links && data.links.length > 0) {
    const { error: linksError } = await supabase
      .from('attachments')
      .insert(
        data.links.map(link => ({
          entity_type: 'task',
          entity_id: task.id,
          title: link.title,
          url: link.url,
          provider_type: link.provider_type,
          created_by: user.id,
        }))
      );

    if (linksError) {
      console.error('Error inserting attachments:', linksError);
      // Note: Task already created, don't fail the whole operation
    }
  }

  revalidatePath('/dashboard/tasks');

  return { success: true, taskId: task.id };
}

export async function updateTask(taskId: string, data: {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  month?: string | null;
  assignee_id?: string | null;
  assignee_ids?: string[];
  reviewer_ids?: string[];
  project_id?: string | null;
}) {
  await requirePageAccess('tasks');

  const supabase = await createClient();

  const updateData: Database['public']['Tables']['tasks']['Update'] = {
    title: data.title,
    description: data.description,
    type: data.type,
    status: data.status,
    priority: data.priority,
    due_date: data.due_date,
    month: data.month,
    assignee_id: data.assignee_id,
    project_id: data.project_id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error);
    return { error: error.message };
  }

  // Update assignees: delete existing and insert new ones
  if (data.assignee_ids !== undefined) {
    // Delete existing assignees
    await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId);

    // Insert new assignees
    if (data.assignee_ids.length > 0) {
      const { error: assigneeError } = await supabase
        .from('task_assignees')
        .insert(
          data.assignee_ids.map(userId => ({
            task_id: taskId,
            user_id: userId,
          }))
        );

      if (assigneeError) {
        console.error('Error updating assignees:', assigneeError);
      }
    }
  }

  // Update reviewers: delete existing and insert new ones
  if (data.reviewer_ids !== undefined) {
    // Delete existing reviewers
    await supabase
      .from('task_reviewers')
      .delete()
      .eq('task_id', taskId);

    // Insert new reviewers
    if (data.reviewer_ids.length > 0) {
      const { error: reviewerError } = await supabase
        .from('task_reviewers')
        .insert(
          data.reviewer_ids.map(userId => ({
            task_id: taskId,
            user_id: userId,
          }))
        );

      if (reviewerError) {
        console.error('Error updating reviewers:', reviewerError);
      }
    }
  }

  revalidatePath('/dashboard/tasks', 'page');
  revalidatePath(`/dashboard/tasks/${taskId}`, 'page');
  revalidatePath('/dashboard', 'page');
  revalidatePath('/api/tasks', 'page');

  return { success: true };
}

export async function deleteTask(taskId: string) {
  await requirePageAccess('tasks');

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

export async function reorderUserTasks(taskPositions: Array<{ task_id: string; position: number }>) {
  await requirePageAccess('tasks');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    // Upsert user task positions (batch update)
    const { error } = await supabase
      .from('user_task_positions')
      .upsert(
        taskPositions.map(({ task_id, position }) => ({
          user_id: user.id,
          task_id,
          position,
          updated_at: new Date().toISOString(),
        })),
        {
          onConflict: 'user_id,task_id'
        }
      );

    if (error) {
      console.error('Error reordering tasks:', error);
      return { error: error.message };
    }

    // Note: We don't revalidatePath here because this is called frequently during drag-and-drop
    // The UI is updated optimistically, and real-time subscriptions will sync the state

    return { success: true };
  } catch (error) {
    console.error('Error in reorderUserTasks:', error);
    return { error: 'Failed to reorder tasks' };
  }
}
