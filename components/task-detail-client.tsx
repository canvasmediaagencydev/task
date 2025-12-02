"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
  UploadCloud,
  Paperclip,
  Download,
  ExternalLink,
  MessageSquare,
  Send,
  Link2,
  FileText,
  Folder,
  UserRound,
} from 'lucide-react';

interface TaskDetailClientProps {
  task: Task;
}

type ExtendedTask = Task & {
  created_by_user?: Task['created_by'];
};

// Mock attachments shown until storage is wired up
const attachmentItems = [
  {
    id: 'brand-guide',
    name: 'Brand_Guidelines.pdf',
    size: '1.2 MB',
    meta: 'PDF',
    action: 'download' as const,
    icon: 'file',
  },
  {
    id: 'campaign-mockups',
    name: 'Campaign_Mockups.fig',
    size: '845 KB',
    meta: 'Figma',
    action: 'download' as const,
    icon: 'folder',
  },
  {
    id: 'miro-link',
    name: 'Inspiration Board',
    size: 'Miro Link',
    meta: 'External',
    action: 'external' as const,
    icon: 'link',
  },
];

// Mock activity log shown before real comments exist
const activityItems = [
  {
    id: 'activity-1',
    author: 'Jane Doe',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Jane',
    timestamp: 'Yesterday at 3:45 PM',
    content: 'Jane changed the status from To Do to In Progress.',
    badge: 'Status Update',
  },
  {
    id: 'activity-2',
    author: 'Olivia Chen',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Olivia',
    timestamp: 'Yesterday at 11:20 AM',
    content:
      'Looks great! I attached a revised version of the brand guidelines with the updated logo assets. Let me know if you have any questions.',
  },
];

export function TaskDetailClient({ task: initialTask }: TaskDetailClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const assignee = initialTask.assignee;
  const projectName = initialTask.project?.name || 'Project';
  const normalizedTask = initialTask as ExtendedTask;
  const createdBy = normalizedTask.created_by_user || normalizedTask.created_by;
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
                <h2 className="text-lg font-semibold">Attachments</h2>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Paperclip className="h-4 w-4" />
                  Add file
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {attachmentItems.map((item) => {
                  const iconMap = {
                    file: FileText,
                    folder: Folder,
                    link: Link2,
                  } as const;
                  const Icon = iconMap[item.icon];

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border bg-background/70 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.meta} · {item.size}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        aria-label={item.action === 'download' ? 'Download' : 'Open link'}
                      >
                        {item.action === 'download' ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Activity</h2>
              </div>
              <div className="space-y-5 rounded-2xl border bg-background/50 p-5">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={createdBy?.avatar_url} alt={createdBy?.full_name} />
                    <AvatarFallback>
                      {createdBy?.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('') || 'ME'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Add a comment..."
                      className="min-h-[96px] resize-none"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <p>Supports markdown formatting.</p>
                      <Button size="sm" disabled>
                        <Send className="mr-2 h-4 w-4" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {activityItems.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={activity.avatar} alt={activity.author} />
                        <AvatarFallback>
                          {activity.author
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-2xl border bg-background/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{activity.author}</p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                          </div>
                          {activity.badge && (
                            <Badge variant="outline" className="rounded-full text-xs">
                              {activity.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {activity.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border bg-background/70 p-5">
              <h2 className="text-lg font-semibold">Details</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Assignee</p>
                  {assignee ? (
                    <div className="mt-2 flex items-center gap-3">
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

            <div className="rounded-2xl border border-dashed border-primary/40 bg-background/60 p-6 text-center">
              <UploadCloud className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-4 text-sm font-medium">Upload files</p>
              <p className="text-xs text-muted-foreground">Click to upload or drag and drop PNG, JPG, PDF (max. 10MB)</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <UploadCloud className="h-4 w-4" />
                Select files
              </Button>
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
    </div>
  );
}
