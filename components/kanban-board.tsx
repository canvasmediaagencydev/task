"use client";

import { useState, useTransition, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Task, TaskStatus } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { updateTaskStatus } from '@/app/actions/tasks';
import { toast } from 'sonner';

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'waiting_review', title: 'Waiting Review' },
  { id: 'sent_client', title: 'Sent to Client' },
  { id: 'feedback', title: 'Feedback' },
  { id: 'approved', title: 'Approved' },
  { id: 'done', title: 'Done' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  statusFilters?: TaskStatus[];
}

export function KanbanBoard({ tasks, onEditTask, statusFilters = [] }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [, startTransition] = useTransition();

  // Sync localTasks with tasks prop when filters change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const task = localTasks.find((t) => t.id === taskId);

    // Determine the new status - could be dropped on column or another task
    let newStatus: TaskStatus;
    const validStatuses: TaskStatus[] = ['backlog', 'in_progress', 'waiting_review', 'sent_client', 'feedback', 'approved', 'done'];

    if (validStatuses.includes(over.id as TaskStatus)) {
      // Dropped on column
      newStatus = over.id as TaskStatus;
    } else {
      // Dropped on another task, find which column that task belongs to
      const targetTask = localTasks.find((t) => t.id === over.id);
      if (!targetTask) {
        setActiveTask(null);
        return;
      }
      newStatus = targetTask.status;
    }

    // Skip if status hasn't changed
    if (task && task.status === newStatus) {
      setActiveTask(null);
      return;
    }

    // Optimistically update UI
    setLocalTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    setActiveTask(null);

    // Update database
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, newStatus);

      if (result.error) {
        // Revert on error
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: task!.status } : t
          )
        );

        toast.error('Failed to update task status');
      } else {
        toast.success('Task status updated');
      }
    });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return localTasks.filter((task) => task.status === status);
  };

  // Show only filtered columns when status filter is active
  const visibleColumns = statusFilters.length > 0
    ? columns.filter((column) => statusFilters.includes(column.id))
    : columns;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksByStatus(column.id)}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
