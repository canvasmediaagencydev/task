"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No recent activities
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 8).map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={activity.created_by?.avatar_url || undefined}
                  alt={activity.created_by?.full_name || 'User'}
                />
                <AvatarFallback>
                  {activity.created_by?.full_name
                    ? activity.created_by.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {activity.created_by?.full_name || 'Unknown user'}
                  </span>{' '}
                  <span className="text-muted-foreground">{activity.description}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
