"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Task } from '@/lib/types';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getTypeColor,
  getTypeLabel,
  formatDate,
  isOverdue,
} from '@/lib/format';
import { ArrowLeft, Calendar, Clock, User, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteTask } from '@/app/actions/tasks';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskDetailClientProps {
  task: Task;
}

export function TaskDetailClient({ task: initialTask }: TaskDetailClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const overdue = initialTask.due_date && isOverdue(initialTask.due_date) && initialTask.status !== 'done';

  const handleDeleteTask = async () => {
    startTransition(async () => {
      const result = await deleteTask(initialTask.id);

      if (result.success) {
        toast.success('Task deleted successfully');
        router.push('/dashboard/tasks');
      } else {
        toast.error('Failed to delete task');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/tasks/${initialTask.id}/edit`)}
            disabled={isPending}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="text-3xl">{initialTask.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn('text-xs', getStatusColor(initialTask.status))}>
                {getStatusLabel(initialTask.status)}
              </Badge>
              <Badge className={cn('text-xs', getPriorityColor(initialTask.priority))}>
                {getPriorityLabel(initialTask.priority)}
              </Badge>
              <Badge className={cn('text-xs', getTypeColor(initialTask.type))}>
                {getTypeLabel(initialTask.type)}
              </Badge>
              {initialTask.project && (
                <Badge variant="outline" className="text-xs">
                  {initialTask.project.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {initialTask.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {initialTask.description}
              </p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {initialTask.assignee && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assignee
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={initialTask.assignee.avatar_url}
                      alt={initialTask.assignee.full_name}
                    />
                    <AvatarFallback>
                      {initialTask.assignee.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{initialTask.assignee.full_name}</span>
                </div>
              </div>
            )}

            {initialTask.due_date && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </h3>
                <div
                  className={cn(
                    'flex items-center gap-2',
                    overdue ? 'text-red-600' : 'text-muted-foreground'
                  )}
                >
                  {overdue && <AlertCircle className="h-4 w-4" />}
                  <span>{formatDate(initialTask.due_date)}</span>
                  {overdue && <span className="text-sm">(Overdue)</span>}
                </div>
              </div>
            )}

            {initialTask.created_by_user && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Created By
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={initialTask.created_by_user.avatar_url}
                      alt={initialTask.created_by_user.full_name}
                    />
                    <AvatarFallback>
                      {initialTask.created_by_user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{initialTask.created_by_user.full_name}</span>
                </div>
              </div>
            )}

            {initialTask.created_at && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Created At
                </h3>
                <p className="text-muted-foreground">
                  {new Date(initialTask.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{initialTask.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
