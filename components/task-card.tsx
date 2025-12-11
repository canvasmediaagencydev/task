"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Task } from '@/lib/types';
import {
  getPriorityColor,
  getTypeColor,
  getPriorityLabel,
  getTypeLabel,
  formatDate,
  isOverdue,
} from '@/lib/format';
import { Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, isDragging, onEdit }: TaskCardProps) {
  const overdue = task.due_date && isOverdue(task.due_date) && task.status !== 'done';

  const handleClick = (e: React.MouseEvent) => {
    if (onEdit) {
      e.stopPropagation();
      onEdit(task);
    }
  };

  return (
    <Card
      className={cn(
        'cursor-move transition-shadow hover:shadow-md',
        isDragging && 'opacity-50',
        onEdit && 'cursor-pointer'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium leading-tight">{task.title}</h4>
            <Badge className={cn('shrink-0 text-xs', getPriorityColor(task.priority))}>
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>

          {task.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge className={cn('text-xs', getTypeColor(task.type))}>
              {getTypeLabel(task.type)}
            </Badge>
            {task.project && (
              <Badge variant="outline" className="text-xs">
                {task.project.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.assignee && (
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
              )}
            </div>

            {task.due_date && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  overdue ? 'text-red-600' : 'text-muted-foreground'
                )}
              >
                {overdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
