'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { requirePageAccess } from '@/lib/page-access';

export async function createComment(taskId: string, comment: string) {
  try {
    await requirePageAccess('tasks');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user has access to this task (assignee, reviewer, or creator)
    const { data: task } = await supabase
      .from('tasks')
      .select('assignee_id, reviewer_id, created_by')
      .eq('id', taskId)
      .single();

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // Check if user is assignee, reviewer, creator, or in junction tables
    const isAssignee = task.assignee_id === user.id;
    const isReviewer = task.reviewer_id === user.id;
    const isCreator = task.created_by === user.id;

    // Check junction tables
    const { data: assigneeData } = await supabase
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: reviewerData } = await supabase
      .from('task_reviewers')
      .select('user_id')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .maybeSingle();

    const isInAssignees = !!assigneeData;
    const isInReviewers = !!reviewerData;

    if (!isAssignee && !isReviewer && !isCreator && !isInAssignees && !isInReviewers) {
      return { success: false, error: 'Access denied' };
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        comment,
      })
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to create comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to create comment';
    return { success: false, error: message };
  }
}

export async function fetchComments(taskId: string) {
  try {
    await requirePageAccess('tasks');

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:users(*)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch comments';
    return { success: false, error: message, data: [] };
  }
}

export async function deleteComment(commentId: string, taskId: string) {
  try {
    await requirePageAccess('tasks');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only allow deleting own comments
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete comment';
    return { success: false, error: message };
  }
}
