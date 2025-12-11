"use client";

import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Trash } from 'lucide-react';
import { createComment, deleteComment } from '@/app/actions/comments';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
}

interface TaskCommentsProps {
  taskId: string;
  currentUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  initialComments?: TaskComment[];
}

export function TaskComments({ taskId, currentUser, initialComments = [] }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>(() => initialComments);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subscribeToComments = useCallback(() => {
    const channel = supabase
      .channel(`task_comments:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
          // Fetch the new comment with user data
          const { data } = await supabase
            .from('task_comments')
            .select(`
              *,
              user:users(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setComments((prev) => {
              if (prev.some((comment) => comment.id === data.id)) {
                return prev;
              }
              return [...prev, data as TaskComment];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  useEffect(() => {
    const cleanup = subscribeToComments();
    return cleanup;
  }, [subscribeToComments]);

  // Auto-scroll to specific comment if hash is present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Remove # from hash
      const elementId = hash.substring(1);
      const element = document.getElementById(elementId);

      if (element) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',  // Center in viewport for better visibility
          });

          // Add highlight effect
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);  // Remove highlight after 2 seconds
        }, 100);
      }
    }
  }, [comments]); // Re-run when comments change to handle late-loaded comments

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
      const result = await createComment(taskId, newComment.trim());

      if (result.success) {
        setNewComment('');
      toast.success('Comment added');
    } else {
      toast.error(result.error || 'Failed to add comment');
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    const result = await deleteComment(commentId, taskId);
    if (result.success) {
        toast.success('Comment deleted');
    } else {
      toast.error(result.error || 'Failed to delete comment');
    }
  }

  const initials = currentUser.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Activity</h2>
      </div>

      <div className="space-y-5 rounded-2xl border bg-background/50 p-5">
        {/* Comment input */}
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Avatar>
            <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.full_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Add a comment..."
              className="min-h-[96px] resize-none"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>Supports markdown formatting.</p>
              <Button size="sm" type="submit" disabled={submitting || !newComment.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs">Be the first to comment on this task</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                id={`comment-${comment.id}`}
                className="flex gap-4 scroll-mt-20"
              >
                <Avatar>
                  <AvatarImage src={comment.user.avatar_url || undefined} alt={comment.user.full_name} />
                  <AvatarFallback>
                    {comment.user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="rounded-2xl border bg-background p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{comment.user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {comment.user_id === currentUser.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
