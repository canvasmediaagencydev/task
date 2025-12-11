import { CheckSquare, FolderKanban, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/stat-card';
import { TaskStatusChart } from '@/components/task-status-chart';
import { RecentActivities } from '@/components/recent-activities';
import { fetchDashboardStats, fetchTaskStatusCounts, fetchRecentActivities } from '@/lib/api';
import { PageGuard } from '@/components/page-guard';

export default async function DashboardPage() {
  const [stats, statusCounts, activities] = await Promise.all([
    fetchDashboardStats(),
    fetchTaskStatusCounts(),
    fetchRecentActivities(),
  ]);

  return (
    <PageGuard page="dashboard">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Button>Create Task</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={stats.total_tasks}
          icon={CheckSquare}
          description="Active tasks in all projects"
        />
        <StatCard
          title="Active Projects"
          value={stats.active_projects}
          icon={FolderKanban}
          description="Currently running projects"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completion_rate}%`}
          icon={TrendingUp}
          description="Tasks completed this month"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue_tasks}
          icon={AlertCircle}
          description="Tasks past their due date"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskStatusChart statusCounts={statusCounts} />
        <RecentActivities activities={activities} />
      </div>
    </div>
    </PageGuard>
  );
}
