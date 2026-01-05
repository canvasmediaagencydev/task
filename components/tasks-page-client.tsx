"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Filter, Search, X, Loader2 } from 'lucide-react';
import { KanbanBoard } from '@/components/kanban-board';
import { TasksTable } from '@/components/tasks-table';
import { TasksCalendar } from '@/components/tasks-calendar';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTasks } from '@/lib/hooks/use-tasks';

interface TasksPageClientProps {
  initialTasks: Task[];
  currentUserId?: string;
}

export function TasksPageClient({ initialTasks, currentUserId }: TasksPageClientProps) {
  const { tasks: realtimeTasks, loading } = useTasks();
  const tasks = loading && realtimeTasks.length === 0 ? initialTasks : realtimeTasks;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'assigned' | 'reviewing' | 'my_tasks'>('all');

  const handleViewTask = (task: Task) => {
    router.push(`/dashboard/tasks/${task.id}`);
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.project?.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilters.length > 0) {
      filtered = filtered.filter((task) => statusFilters.includes(task.status));
    }

    // Apply priority filter
    if (priorityFilters.length > 0) {
      filtered = filtered.filter((task) => priorityFilters.includes(task.priority));
    }

    // Apply role filter
    if (roleFilter === 'assigned' && currentUserId) {
      filtered = filtered.filter((task) =>
        task.assignees?.some(a => a?.id === currentUserId)
      );
    } else if (roleFilter === 'reviewing' && currentUserId) {
      filtered = filtered.filter((task) =>
        task.reviewers?.some(r => r?.id === currentUserId)
      );
    } else if (roleFilter === 'my_tasks' && currentUserId) {
      filtered = filtered.filter((task) =>
        task.assignees?.some(a => a?.id === currentUserId) ||
        task.reviewers?.some(r => r?.id === currentUserId)
      );
    }

    return filtered;
  }, [tasks, searchQuery, statusFilters, priorityFilters, roleFilter, currentUserId]);

  const toggleStatusFilter = (status: TaskStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: TaskPriority) => {
    setPriorityFilters((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setRoleFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilters.length > 0 || priorityFilters.length > 0 || roleFilter !== 'all' || searchQuery;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all your tasks across projects
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {statusFilters.length + priorityFilters.length + (roleFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes('backlog')}
                onCheckedChange={() => toggleStatusFilter('backlog')}
              >
                Backlog
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes('in_progress')}
                onCheckedChange={() => toggleStatusFilter('in_progress')}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes('waiting_review')}
                onCheckedChange={() => toggleStatusFilter('waiting_review')}
              >
                Waiting Review
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes('sent_client')}
                onCheckedChange={() => toggleStatusFilter('sent_client')}
              >
                Sent to Client
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes('feedback')}
                onCheckedChange={() => toggleStatusFilter('feedback')}
              >
                Feedback
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes('approved')}
                onCheckedChange={() => toggleStatusFilter('approved')}
              >
                Approved
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes('done')}
                onCheckedChange={() => toggleStatusFilter('done')}
              >
                Done
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes('low')}
                onCheckedChange={() => togglePriorityFilter('low')}
              >
                Low
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes('normal')}
                onCheckedChange={() => togglePriorityFilter('normal')}
              >
                Normal
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes('high')}
                onCheckedChange={() => togglePriorityFilter('high')}
              >
                High
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes('urgent')}
                onCheckedChange={() => togglePriorityFilter('urgent')}
              >
                Urgent
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={roleFilter === 'all'}
                onCheckedChange={() => setRoleFilter('all')}
              >
                All Tasks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter === 'my_tasks'}
                onCheckedChange={() => setRoleFilter('my_tasks')}
              >
                My Tasks (Assigned or Reviewing)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter === 'assigned'}
                onCheckedChange={() => setRoleFilter('assigned')}
              >
                Assigned to Me
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter === 'reviewing'}
                onCheckedChange={() => setRoleFilter('reviewing')}
              >
                Reviewing
              </DropdownMenuCheckboxItem>

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={clearFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => router.push('/dashboard/tasks/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      )}

      <Tabs defaultValue="kanban" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <KanbanBoard
            tasks={filteredTasks}
            onEditTask={handleViewTask}
            statusFilters={statusFilters}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <TasksTable tasks={filteredTasks} onEditTask={handleViewTask} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <TasksCalendar tasks={filteredTasks} onEditTask={handleViewTask} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
