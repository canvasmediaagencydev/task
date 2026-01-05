"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/lib/types';
import { TaskCard } from './task-card';

interface SortableTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  currentUserId?: string;
}

export function SortableTaskCard({ task, onEdit, currentUserId }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} onEdit={onEdit} currentUserId={currentUserId} />
    </div>
  );
}
