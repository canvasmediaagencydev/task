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
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { updateTaskStatus, reorderUserTasks } from '@/app/actions/tasks';
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
  currentUserId?: string;
}

export function KanbanBoard({ tasks, onEditTask, statusFilters = [], currentUserId }: KanbanBoardProps) {
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

    if (!task) {
      setActiveTask(null);
      return;
    }

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

    // ============ NEW: Handle same-column reordering ============
    const isSameColumn = task.status === newStatus;
    const isDroppedOnTask = !validStatuses.includes(over.id as TaskStatus);

    if (isSameColumn && isDroppedOnTask) {
      // Reordering within the same column
      const tasksInColumn = localTasks.filter((t) => t.status === task.status);
      const oldIndex = tasksInColumn.findIndex((t) => t.id === active.id);
      const newIndex = tasksInColumn.findIndex((t) => t.id === over.id);

      // Skip if dropped on itself
      if (oldIndex === newIndex) {
        setActiveTask(null);
        return;
      }

      // Reorder tasks within column using arrayMove
      const reorderedColumnTasks = arrayMove(tasksInColumn, oldIndex, newIndex);

      // Merge back into full task list
      const otherTasks = localTasks.filter((t) => t.status !== task.status);
      const newTaskList = [...otherTasks, ...reorderedColumnTasks];

      // Optimistically update UI
      setLocalTasks(newTaskList);
      setActiveTask(null);

      // Calculate position updates (100-based spacing for flexibility)
      const positionUpdates = reorderedColumnTasks.map((t, index) => ({
        task_id: t.id,
        position: (index + 1) * 100,
      }));

      // Persist to database (non-blocking)
      startTransition(async () => {
        const result = await reorderUserTasks(positionUpdates);

        if (result?.error) {
          // Revert on error
          setLocalTasks(localTasks);
          toast.error('Failed to reorder tasks');
        } else {
          toast.success('Task order updated');
        }
      });

      return; // Exit early, don't proceed to status change logic
    }
    // ============ END NEW CODE ============

    // Skip if status hasn't changed (cross-column drop on same status)
    if (task.status === newStatus) {
      setActiveTask(null);
      return;
    }

    // Optimistically update UI for status change
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );

    setActiveTask(null);

    // Update database for status change
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
      collisionDetection={closestCenter}
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
            currentUserId={currentUserId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
