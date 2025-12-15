"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Task } from '@/lib/types';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getTypeLabel,
  formatDate,
  isOverdue,
} from '@/lib/format';
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
import { cn } from '@/lib/utils';
import { deleteTask } from '@/app/actions/tasks';
import { toast } from 'sonner';
import {
  Calendar,
  Flag,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRound,
  ExternalLink,
  FileText,
  Link2,
  Trash,
} from 'lucide-react';
import { AddLinkDialog } from '@/components/add-link-dialog';
import { deleteAttachment } from '@/app/actions/attachments';
import { TaskComments, TaskComment } from '@/components/task-comments';
import type { Database } from '@/database.types';

interface TaskDetailClientProps {
  task: Task;
  attachments?: Array<
    Database['public']['Tables']['attachments']['Row'] & {
      created_by: Database['public']['Tables']['users']['Row'] | null;
    }
  >;
  initialComments?: TaskComment[];
}

export function TaskDetailClient({
  task: initialTask,
  attachments = [],
  initialComments = [],
}: TaskDetailClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const assignees = initialTask.assignees || [];
  const projectName = initialTask.project?.name || 'Project';
  const createdBy = initialTask.created_by;
  const overdue =
    initialTask.due_date && isOverdue(initialTask.due_date) && initialTask.status !== 'done';

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
      <section className="rounded-3xl border bg-card/80 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Projects / {projectName} / Task</p>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight">
                {initialTask.title}
              </h1>
              {initialTask.description && (
                <p className="max-w-3xl text-muted-foreground">
                  {initialTask.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/tasks/${initialTask.id}/edit`)}
              disabled={isPending}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Task actions">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => router.push('/dashboard/tasks')}>
                  View all tasks
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push(`/dashboard/projects/${initialTask.project?.id || ''}`)}
                >
                  View project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Task Description</h2>
              <div className="rounded-2xl border bg-background/60 p-5 text-sm leading-relaxed text-muted-foreground">
                {initialTask.description || 'No description has been added for this task yet.'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Links & Attachments</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setAddLinkOpen(true)}
                >
                  <Link2 className="h-4 w-4" />
                  Add link
                </Button>
              </div>
              {attachments.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-background/50 p-8 text-center">
                  <Link2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No links yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add links to Google Drive, Figma, or other resources
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((attachment) => {
                    const providerType = attachment.provider_type || 'other';
                    const getIcon = (type: string) => {
                      if (type.includes('google')) return FileText;
                      if (type === 'figma' || type === 'canva') return FileText;
                      return Link2;
                    };
                    const Icon = getIcon(providerType);

                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between rounded-2xl border bg-background/70 p-4 hover:bg-background"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="rounded-2xl bg-primary/10 p-3 text-primary flex-shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {providerType.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            asChild
                          >
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              if (confirm('Remove this link?')) {
                                const result = await deleteAttachment(
                                  attachment.id,
                                  'task',
                                  initialTask.id
                                );
                                if (result.success) {
                                  toast.success('Link removed');
                                  router.refresh();
                                } else {
                                  toast.error('Failed to remove link');
                                }
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <TaskComments
              key={initialTask.id}
              taskId={initialTask.id}
              currentUser={{
                id: createdBy?.id || '',
                full_name: createdBy?.full_name || 'User',
                avatar_url: createdBy?.avatar_url || null,
              }}
              initialComments={initialComments}
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border bg-background/70 p-5">
              <h2 className="text-lg font-semibold">Details</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Assignees</p>
                  {assignees.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {assignees.map((assignee) => (
                        <div key={assignee.id} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={assignee.avatar_url} alt={assignee.full_name} />
                            <AvatarFallback>
                              {assignee.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{assignee.full_name}</p>
                            <p className="text-xs text-muted-foreground">{assignee.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">Unassigned</p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={cn('rounded-full px-3 py-1 text-xs', getStatusColor(initialTask.status))}>
                      {getStatusLabel(initialTask.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{getTypeLabel(initialTask.type)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Project</p>
                  <div className="mt-2 flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{projectName}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Due date</p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Calendar className={cn('h-4 w-4', overdue ? 'text-destructive' : 'text-muted-foreground')} />
                    {initialTask.due_date ? (
                      <span className={cn(overdue && 'text-destructive')}> {formatDate(initialTask.due_date)} </span>
                    ) : (
                      <span className="text-muted-foreground">No due date</span>
                    )}
                    {overdue && <span className="text-xs text-destructive">Overdue</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Priority</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <Badge className={cn('rounded-full px-3 py-1 text-xs', getPriorityColor(initialTask.priority))}>
                      {getPriorityLabel(initialTask.priority)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Created</p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {new Date(initialTask.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </section>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              titled <span className="font-semibold">{initialTask.title}</span>.
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

      <AddLinkDialog
        open={addLinkOpen}
        onOpenChange={setAddLinkOpen}
        entityType="task"
        entityId={initialTask.id}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
