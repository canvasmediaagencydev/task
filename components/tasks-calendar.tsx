"use client";

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusColor, getPriorityColor } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TasksCalendarProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}

export function TasksCalendar({ tasks, onEditTask }: TasksCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (task) => task.due_date && isSameDay(new Date(task.due_date), date)
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openDayDialog = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[120px] rounded-lg border bg-muted/20" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map((date) => {
          const dayTasks = getTasksForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                'min-h-[120px] rounded-lg border p-2',
                isCurrentMonth ? 'bg-card' : 'bg-muted/20',
                isCurrentDay && 'ring-2 ring-primary'
              )}
            >
              <div
                className={cn(
                  'mb-2 text-sm font-medium',
                  isCurrentDay && 'text-primary',
                  !isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {format(date, 'd')}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'truncate rounded px-1.5 py-0.5 text-xs cursor-pointer hover:opacity-80',
                      getStatusColor(task.status)
                    )}
                    title={task.title}
                    onClick={() => onEditTask?.(task)}
                  >
                    {task.title}
                  </div>
                ))}

                {dayTasks.length > 3 && (
                  <button
                    className="text-xs text-primary hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDayDialog(date);
                    }}
                  >
                    +{dayTasks.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog to show all tasks for a selected date */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {selectedDateTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks for this date</p>
            ) : (
              selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setIsDialogOpen(false);
                    onEditTask?.(task);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                    <span className={cn(
                      'shrink-0 text-xs px-2 py-0.5 rounded',
                      getPriorityColor(task.priority)
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      getStatusColor(task.status)
                    )}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.project && (
                      <span className="text-xs text-muted-foreground">
                        {task.project.name}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
