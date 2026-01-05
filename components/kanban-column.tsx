"use client";

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/lib/types';
import { SortableTaskCard } from './sortable-task-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  currentUserId?: string;
}

export function KanbanColumn({ id, title, tasks, onEditTask, currentUserId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex min-w-[320px] flex-col rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between border-b bg-card p-4">
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-3 p-4',
          isOver && 'bg-primary/5'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onEdit={onEditTask} currentUserId={currentUserId} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-sm text-muted-foreground">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
