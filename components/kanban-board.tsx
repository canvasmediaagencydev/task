"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  UniqueIdentifier,
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

// Custom collision detection for Kanban board
// Prioritizes task collisions, then falls back to column collisions
const customCollisionDetection: CollisionDetection = (args) => {
  // First, try to find collisions with sortable items (tasks)
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    // Filter for task collisions (non-column IDs)
    const validStatuses: TaskStatus[] = ['backlog', 'in_progress', 'waiting_review', 'sent_client', 'feedback', 'approved', 'done'];
    const taskCollisions = pointerCollisions.filter(
      collision => !validStatuses.includes(collision.id as TaskStatus)
    );

    if (taskCollisions.length > 0) {
      return taskCollisions;
    }

    // Return column collisions if no task collisions
    return pointerCollisions;
  }

  // Fallback to rect intersection for broader detection
  return rectIntersection(args);
};

export function KanbanBoard({ tasks, onEditTask, statusFilters = [], currentUserId }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [, startTransition] = useTransition();
  const isDraggingRef = useRef(false);
  const pendingUpdateRef = useRef<Task[] | null>(null);

  // Sync localTasks with tasks prop, but not during drag operations
  useEffect(() => {
    if (isDraggingRef.current) {
      // Store the update to apply after drag ends
      pendingUpdateRef.current = tasks;
      return;
    }
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
    isDraggingRef.current = true;
    const task = localTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  // Find which column a task belongs to
  const findColumn = useCallback((taskId: UniqueIdentifier): TaskStatus | null => {
    const task = localTasks.find((t) => t.id === taskId);
    return task?.status ?? null;
  }, [localTasks]);

  // Handle drag over for visual feedback during cross-column drag
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const validStatuses: TaskStatus[] = ['backlog', 'in_progress', 'waiting_review', 'sent_client', 'feedback', 'approved', 'done'];

    // Find the column of the active item
    const activeColumn = findColumn(activeId);
    if (!activeColumn) return;

    // Determine over column
    let overColumn: TaskStatus;
    if (validStatuses.includes(overId as TaskStatus)) {
      overColumn = overId as TaskStatus;
    } else {
      const foundColumn = findColumn(overId);
      if (!foundColumn) return;
      overColumn = foundColumn;
    }

    // If moving to a different column, update the task's status optimistically
    if (activeColumn !== overColumn) {
      setLocalTasks((prev) => {
        const activeTask = prev.find((t) => t.id === activeId);
        if (!activeTask) return prev;

        // Move task to new column
        const newTasks = prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn } : t
        );

        return newTasks;
      });
    }
  }, [findColumn]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Mark drag as ended
    isDraggingRef.current = false;

    if (!over) {
      setActiveTask(null);
      // Apply any pending updates that came during drag
      if (pendingUpdateRef.current) {
        setLocalTasks(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
      return;
    }

    const taskId = active.id as string;
    // Get the original task from props (before any drag modifications)
    const originalTask = tasks.find((t) => t.id === taskId);
    const task = localTasks.find((t) => t.id === taskId);

    if (!task || !originalTask) {
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

    // ============ Handle same-column reordering ============
    // Use originalTask.status to compare against original position
    const isSameColumn = originalTask.status === newStatus;
    const isDroppedOnTask = !validStatuses.includes(over.id as TaskStatus);

    if (isSameColumn && isDroppedOnTask) {
      // Reordering within the same column
      const tasksInColumn = localTasks.filter((t) => t.status === newStatus);
      const oldIndex = tasksInColumn.findIndex((t) => t.id === active.id);
      const newIndex = tasksInColumn.findIndex((t) => t.id === over.id);

      // Skip if dropped on itself or indices are invalid
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setActiveTask(null);
        return;
      }

      // Reorder tasks within column using arrayMove
      const reorderedColumnTasks = arrayMove(tasksInColumn, oldIndex, newIndex);

      // Merge back into full task list while preserving order
      const otherTasks = localTasks.filter((t) => t.status !== newStatus);
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
          // Revert on error - use original tasks from props
          setLocalTasks(tasks);
          toast.error('Failed to reorder tasks');
        } else {
          toast.success('Task order updated');
        }
      });

      return; // Exit early, don't proceed to status change logic
    }
    // ============ END same-column reordering ============

    // ============ Handle cross-column status change ============
    // Skip if status hasn't changed from original
    if (originalTask.status === newStatus) {
      setActiveTask(null);
      return;
    }

    // UI already updated during onDragOver, just persist to database
    setActiveTask(null);

    // Update database for status change
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, newStatus);

      if (result.error) {
        // Revert on error - restore original status
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: originalTask.status } : t
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
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
