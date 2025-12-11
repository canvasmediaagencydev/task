"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TaskStatusCount } from '@/lib/types';
import { getStatusLabel } from '@/lib/format';

const COLORS = {
  backlog: '#6B7280',
  in_progress: '#3B82F6',
  waiting_review: '#EAB308',
  sent_client: '#A855F7',
  feedback: '#F97316',
  approved: '#22C55E',
  done: '#10B981',
};

interface TaskStatusChartProps {
  statusCounts: TaskStatusCount[];
}

export function TaskStatusChart({ statusCounts }: TaskStatusChartProps) {
  const data = statusCounts
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: getStatusLabel(item.status),
      value: item.count,
      status: item.status,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No tasks yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
