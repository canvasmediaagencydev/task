"use client";

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/format';

interface TasksCalendarProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}

export function TasksCalendar({ tasks, onEditTask }: TasksCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
                  <div className="text-xs text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
