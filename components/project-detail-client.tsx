"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Project, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TasksTable } from '@/components/tasks-table';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
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

interface ProjectDetailClientProps {
  project: Project;
  tasks: Task[];
  isMock?: boolean;
}

const statusStyles: Record<Project['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-500',
  on_hold: 'bg-amber-500/10 text-amber-500',
  done: 'bg-blue-500/10 text-blue-500',
};

export function ProjectDetailClient({ project, tasks, isMock }: ProjectDetailClientProps) {
  const router = useRouter();

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
        onClick={() => router.push('/dashboard/projects')}
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
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
            {isMock && (
              <p className="text-xs text-muted-foreground">
                Mock project preview. Replace with Supabase data once available.
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3 text-sm text-muted-foreground">
            <Badge className={cn('rounded-full px-4 py-1 text-xs capitalize', statusStyles[project.status])}>
              {project.status.replace('_', ' ')}
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
              <div>
                <CardTitle className="text-xl">Project Description</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Mock narrative content. Replace once real data is available.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Edit project
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                A comprehensive campaign to boost brand recognition for Client X in the third quarter. The
                primary goal is to increase market share by 15% through a multi-channel approach including
                social media, content marketing, and a targeted digital advertising strategy.
              </p>
              <p>
                Key performance indicators will be tracked weekly, with a full report delivered at the end of
                the campaign. This copy mirrors the design mock for now.
              </p>
            </CardContent>
          </Card>

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

          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                {
                  title: 'Kickoff & Discovery',
                  date: 'Jul 15 - Jul 22',
                  description: 'Initial client meetings, scope definition, and research phase.',
                },
                {
                  title: 'Creative Development',
                  date: 'Jul 23 - Aug 19',
                  description: 'Concepting, copywriting, and visual design production.',
                },
                {
                  title: 'Client Presentation',
                  date: 'Aug 27',
                  description: 'Review of creative assets and campaign strategy with the client.',
                },
                {
                  title: 'Campaign Launch',
                  date: 'Sep 9',
                  description: 'Public launch across all selected marketing channels.',
                },
              ].map((milestone, index) => (
                <div key={milestone.title} className="rounded-2xl border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Stage {index + 1}</p>
                  <p className="mt-1 font-medium">{milestone.title}</p>
                  <p className="text-sm text-muted-foreground">{milestone.date}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{milestone.description}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">*Milestones currently mirror the mock design.</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Communications</CardTitle>
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  author: 'Marcus Cole',
                  timestamp: '2 hours ago',
                  message:
                    'First draft of the social media copy is ready for review in the linked Google Doc. Let me know your thoughts!',
                },
                {
                  author: 'Eleanor Vance',
                  timestamp: 'Yesterday',
                  message:
                    'Client feedback on the initial mockups was very positive. Lena, great work! They just had a few minor color tweaks.',
                },
              ].map((comment) => (
                <div key={comment.author} className="rounded-2xl border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    {comment.author}
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{comment.message}</p>
                </div>
              ))}
              <Button className="w-full">Post Comment</Button>
              <p className="text-xs text-muted-foreground">*Comments are static placeholders.</p>
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
            <p className="mt-4 text-center text-xs text-white/60">*Contact CTA mirrors mockup.</p>
          </div>

          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                {
                  label: 'Project Lead',
                  value: project.ae?.full_name || 'Eleanor Vance',
                  email: project.ae?.email || 'e.vance@agency.com',
                },
                {
                  label: 'Copywriter',
                  value: project.sales_person?.full_name || 'Marcus Cole',
                  email: project.sales_person?.email || 'm.cole@agency.com',
                },
                {
                  label: 'Art Director',
                  value: 'Lena Petrova',
                  email: 'l.petrova@agency.com',
                },
              ].map((member) => (
                <div key={member.label} className="rounded-2xl border bg-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">{member.label}</p>
                  <p className="font-medium">{member.value}</p>
                  <p className="text-muted-foreground">{member.email}</p>
                  <p className="text-[11px] text-muted-foreground">*Mock entry until team data exists.</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Linked Files</CardTitle>
              <Button variant="outline" size="sm">
                + Add link
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Project Brief', icon: FileText },
                { label: 'Landing Page Mockups', icon: FileImage },
                { label: 'Social Media Graphics', icon: FileImage },
                { label: 'Content Calendar', icon: FileSpreadsheet },
                { label: 'Social Media Copy', icon: FileText },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex w-full items-center justify-between rounded-2xl border bg-muted/40 px-4 py-3 text-left transition hover:bg-muted/60"
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label} <span className="text-[11px] text-muted-foreground">*Mock file</span>
                  </span>
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
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
    </div>
  );
}
