"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TasksTable } from '@/components/tasks-table';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';

type ProjectRow = Database['public']['Tables']['projects']['Row'] & {
  client: Database['public']['Tables']['clients']['Row'] | null;
  sales_person: Database['public']['Tables']['users']['Row'] | null;
  ae: Database['public']['Tables']['users']['Row'] | null;
  pipeline_stage: Database['public']['Tables']['pipeline_stages']['Row'] | null;
};

interface ProjectDetailClientProps {
  project: ProjectRow;
  tasks: Task[];
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white',
  on_hold: 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white',
  done: 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white',
};

export function ProjectDetailClient({ project, tasks }: ProjectDetailClientProps) {
  const router = useRouter();
  const projectStatus = project.status || 'active';

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
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="rounded-3xl border bg-card/80 p-6 shadow-sm md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Project overview</p>
              <h1 className="text-3xl font-semibold md:text-4xl">{project.name}</h1>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {project.client?.name}
              </p>
              <p className="flex items-center gap-2 capitalize">
                <Users className="h-4 w-4" />
                {project.sales_person?.full_name || project.ae?.full_name || 'Unassigned'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-sm text-muted-foreground">
            <Badge className={cn('rounded-full px-4 py-1 text-xs capitalize', statusStyles[projectStatus])}>
              {projectStatus.replace('_', ' ')}
            </Badge>
            <div className="flex flex-col items-end gap-2 text-right">
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
    </div>
  );
}
