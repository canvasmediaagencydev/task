"use client";

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TasksTable } from '@/components/tasks-table';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { deleteProject } from '@/app/actions/projects';
import { toast } from 'sonner';
import type { Database } from '@/database.types';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  UserCircle2,
  Phone,
  Mail,
  Building2,
  ClipboardList,
  PhoneCall,
  FileText,
  FileSpreadsheet,
  FileImage,
  Link2,
  MessageSquare,
  ExternalLink,
  Edit,
  StickyNote,
  CheckCircle,
  Trash2,
} from 'lucide-react';

type ProjectRow = Database['public']['Tables']['projects']['Row'] & {
  client: Database['public']['Tables']['clients']['Row'] | null;
  sales_person: Database['public']['Tables']['users']['Row'] | null;
  ae: Database['public']['Tables']['users']['Row'] | null;
  pipeline_stage: Database['public']['Tables']['pipeline_stages']['Row'] | null;
  created_by_user: Database['public']['Tables']['users']['Row'] | null;
  project_sales_persons?: Array<{
    users: Database['public']['Tables']['users']['Row'] | null;
  }>;
  project_account_executives?: Array<{
    users: Database['public']['Tables']['users']['Row'] | null;
  }>;
};

interface ProjectDetailClientProps {
  project: ProjectRow;
  tasks: Task[];
  salesPersons?: User[];
  accountExecutives?: User[];
  attachments: Database['public']['Tables']['attachments']['Row'][];
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white',
  on_hold: 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white',
  done: 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white',
};

export function ProjectDetailClient({ project, tasks, salesPersons, accountExecutives, attachments }: ProjectDetailClientProps) {
  const router = useRouter();
  const projectStatus = project.status || 'active';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'done').length;
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
    const waiting = tasks.filter((task) => task.status === 'waiting_review').length;

    return {
      total,
      active: total - completed,
      completed,
      inProgress,
      waiting,
    };
  }, [tasks]);

  const handleViewTask = (task: Task) => {
    router.push(`/dashboard/tasks/${task.id}`);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject(project.id);

      if (result.success) {
        toast.success('Project deleted successfully');
        router.push('/dashboard/projects');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    });
  };

  const contactEmail = project.client?.email || project.sales_person?.email || project.ae?.email;
  const contactPhone = project.client?.phone;
  const contactHref = contactEmail
    ? `mailto:${contactEmail}`
    : contactPhone
    ? `tel:${contactPhone}`
    : undefined;
  const contactLabel = project.client?.contact_person || project.client?.name || 'ทีมงานของเรา';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/80 p-6 shadow-sm md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Project overview</p>
              <h1 className="text-3xl font-semibold md:text-4xl">{project.name}</h1>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {project.client?.name}
              </p>
              {salesPersons && salesPersons.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs uppercase text-muted-foreground/70">Sales</p>
                    <p>{salesPersons.map(sp => sp.full_name).join(', ')}</p>
                  </div>
                </div>
              )}
              {accountExecutives && accountExecutives.length > 0 && (
                <div className="flex items-start gap-2">
                  <UserCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs uppercase text-muted-foreground/70">Account Executives</p>
                    <p>{accountExecutives.map(ae => ae.full_name).join(', ')}</p>
                  </div>
                </div>
              )}
              {project.pipeline_stage && (
                <p className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  {project.pipeline_stage.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-sm text-muted-foreground">
            <Badge className={cn('rounded-full px-4 py-1 text-xs capitalize', statusStyles[projectStatus])}>
              {projectStatus.replace('_', ' ')}
            </Badge>
            <div className="flex flex-col items-end gap-2 text-right">
              {project.confirmed_at && (
                <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  Confirmed {formatDate(project.confirmed_at)}
                </span>
              )}
              {project.start_date && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Starts {formatDate(project.start_date)}
                </span>
              )}
              {project.end_date && (
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Due {formatDate(project.end_date)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-muted/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tasks</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
            <span className="text-xs text-muted-foreground">Total open items</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-muted/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">In Progress</p>
            <p className="text-2xl font-semibold">{stats.inProgress}</p>
            <span className="text-xs text-muted-foreground">Actively being worked on</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-muted/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
            <p className="text-2xl font-semibold">{stats.completed}</p>
            <span className="text-xs text-muted-foreground">Marked as done</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Tasks</CardTitle>
              <Button size="sm" onClick={() => router.push(`/dashboard/tasks/new?projectId=${project.id}`)}>
                Add task
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <TasksTable tasks={tasks} onEditTask={handleViewTask} />
              ) : (
                <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
                  No tasks are linked to this project yet.
                </div>
              )}
            </CardContent>
          </Card>

          {(project.internal_notes || project.qt_link || project.brief_link) && (
            <Card className="rounded-3xl border bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.internal_notes && (
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      Internal Notes
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.internal_notes}</p>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {project.qt_link && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      asChild
                    >
                      <a href={project.qt_link} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        QT Link
                        <ExternalLink className="ml-auto h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {project.brief_link && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      asChild
                    >
                      <a href={project.brief_link} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Brief Link
                        <ExternalLink className="ml-auto h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {attachments && attachments.length > 0 && (
            <Card className="rounded-3xl border bg-card/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Project Files</CardTitle>
                <Button variant="outline" size="sm">
                  <Link2 className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {attachments.map((attachment) => {
                  const providerType = attachment.provider_type || 'other';
                  const getIcon = (type: string) => {
                    if (type.includes('google_drive')) return FileText;
                    if (type.includes('google_docs')) return FileText;
                    if (type.includes('google_sheets')) return FileSpreadsheet;
                    if (type === 'figma' || type === 'canva') return FileImage;
                    return Link2;
                  };
                  const Icon = getIcon(providerType);

                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-2xl border bg-muted/40 p-4 hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {providerType.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        asChild
                      >
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
            <p className="text-sm font-semibold">ติดต่อเรา</p>
            <p className="mt-1 text-xs text-white/70">พูดคุยกับ {contactLabel}</p>
            <div className="mt-6 flex justify-center">
              {contactHref ? (
                <Button
                  asChild
                  size="icon-lg"
                  variant="ghost"
                  className="rounded-2xl border border-white/30 bg-white/10 text-white backdrop-blur"
                >
                  <a href={contactHref}>
                    <PhoneCall className="h-5 w-5" />
                  </a>
                </Button>
              ) : (
                <Button
                  size="icon-lg"
                  variant="ghost"
                  disabled
                  className="rounded-2xl border border-white/20 bg-white/5 text-white/40"
                >
                  <PhoneCall className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {project.created_at && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p>{formatDate(project.created_at)}</p>
                  </div>
                </div>
              )}
              {project.created_by_user && (
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Created By</p>
                    <p>{project.created_by_user.full_name}</p>
                  </div>
                </div>
              )}
              {project.confirmed_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                    <p className="text-emerald-600 dark:text-emerald-400">{formatDate(project.confirmed_at)}</p>
                  </div>
                </div>
              )}
              {project.updated_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p>{formatDate(project.updated_at)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Client Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {project.client?.company_name || project.client?.name}
              </div>
              {project.client?.contact_person && (
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" />
                  <span>{project.client.contact_person}</span>
                </div>
              )}
              {project.client?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{project.client.email}</span>
                </div>
              )}
              {project.client?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{project.client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClipboardList className="h-4 w-4" />
                Project ID: {project.id}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
              All tasks associated with this project will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
