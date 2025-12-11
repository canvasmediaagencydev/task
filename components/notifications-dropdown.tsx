"use client";

import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, NotificationItem } from '@/lib/hooks/use-notifications';
import { markAsRead, markAllAsRead, deleteNotification } from '@/app/actions/notifications';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationsDropdown() {
  const { notifications, unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleMarkAsRead(notificationId: string) {
    const result = await markAsRead(notificationId);
    if (result.success) {
      refresh();
    }
  }

  async function handleMarkAllAsRead() {
    const result = await markAllAsRead();
    if (result.success) {
      toast.success('All notifications marked as read');
      refresh();
    }
  }

  async function handleDelete(notificationId: string) {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      toast.success('Notification deleted');
      refresh();
    }
  }

  function handleNotificationClick(notification: NotificationItem) {
    // Mark as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to entity
    if (notification.entity_type === 'task' && notification.entity_id) {
      setOpen(false);

      // Build URL with hash for comment notifications
      let url = `/dashboard/tasks/${notification.entity_id}`;

      if (notification.type === 'comment' && notification.metadata?.comment_id) {
        // Navigate to specific comment
        url += `#comment-${notification.metadata.comment_id}`;
      }

      router.push(url);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-0",
                    !notification.is_read && "bg-accent/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {notification.related_user ? (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={notification.related_user.avatar_url || undefined}
                          alt={notification.related_user.full_name}
                        />
                        <AvatarFallback className="text-xs">
                          {notification.related_user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
