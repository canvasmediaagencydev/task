"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ArrowUpDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TasksTableProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'assignee';
type SortDirection = 'asc' | 'desc';

export function TasksTable({ tasks, onEditTask }: TasksTableProps) {
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'priority':
        const priorityOrder = { low: 0, normal: 1, high: 2, urgent: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'due_date':
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
        comparison = aDate - bDate;
        break;
      case 'assignee':
        const aName = a.assignee?.full_name || '';
        const bName = b.assignee?.full_name || '';
        comparison = aName.localeCompare(bName);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('title')}
              >
                Task
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('status')}
              >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('priority')}
              >
                Priority
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('assignee')}
              >
                Assignee
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('due_date')}
              >
                Due Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const overdue = task.due_date && isOverdue(task.due_date) && task.status !== 'done';

            return (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEditTask?.(task)}
              >
                <TableCell className="font-medium">
                  <div>
                    <div>{task.title}</div>
                    {task.description && (
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {task.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', getStatusColor(task.status))}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', getTypeColor(task.type))}>
                    {getTypeLabel(task.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={task.assignee.avatar_url}
                          alt={task.assignee.full_name}
                        />
                        <AvatarFallback className="text-xs">
                          {task.assignee.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div className={cn('flex items-center gap-1 text-sm', overdue && 'text-red-600')}>
                      {overdue && <AlertCircle className="h-4 w-4" />}
                      {formatDate(task.due_date)}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{task.project?.name || '-'}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
