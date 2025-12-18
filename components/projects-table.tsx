"use client";

import { useMemo, useState } from 'react';
import { Project, Task } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface ProjectsTableProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject?: (project: Project) => void;
}

const statusMap: Record<Project['status'], { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white',
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white',
  },
  done: {
    label: 'Completed',
    className: 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white',
  },
};

export function ProjectsTable({ projects, tasks, onSelectProject }: ProjectsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Project['status'] | 'all'>('all');
  const [clientFilter, setClientFilter] = useState('all');

  const clients = useMemo(() => Array.from(new Set(projects.map((p) => p.client?.name).filter(Boolean))), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = [project.name, project.client?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesClient = clientFilter === 'all' || project.client?.name === clientFilter;
      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [projects, search, statusFilter, clientFilter]);

  const enhancedProjects = useMemo(() => {
    return filteredProjects.map((project) => {
      const projectTasks = tasks.filter((task) => task.project?.id === project.id);
      const completed = projectTasks.filter((task) => task.status === 'done').length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

      return { project, projectTasks, progress };
    });
  }, [filteredProjects, tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Projects Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Filter by client, status, or lead to spot risks before they escalate.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name or client..."
              className="h-10 rounded-full bg-muted pl-9"
            />
          </div>
          <div className="min-w-[160px]">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Project['status'] | 'all')}>
              <SelectTrigger className="h-10 rounded-full bg-muted">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="done">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="h-10 rounded-full bg-muted">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client} value={client!}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            className="rounded-full border bg-background"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setClientFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project Lead</TableHead>
                <TableHead>Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enhancedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No projects found for your current filters.
                  </TableCell>
                </TableRow>
              ) : (
                enhancedProjects.map(({ project, projectTasks, progress }) => (
                  <TableRow
                    key={project.id}
                    className={cn('cursor-pointer', onSelectProject && 'hover:bg-muted/60')}
                    onClick={() => onSelectProject?.(project)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{projectTasks.length} tasks</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusMap[project.status].className)}>
                        {statusMap[project.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.client?.name || '—'}</TableCell>
                    <TableCell>
                      {project.account_executives && project.account_executives.length > 0 ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={project.account_executives[0].avatar_url} alt={project.account_executives[0].full_name} />
                            <AvatarFallback>
                              {project.account_executives[0].full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {project.account_executives[0].full_name}
                            {project.account_executives.length > 1 && (
                              <span className="text-muted-foreground"> +{project.account_executives.length - 1}</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {enhancedProjects.length} of {projects.length} results
        </p>
      </CardContent>
    </Card>
  );
}
