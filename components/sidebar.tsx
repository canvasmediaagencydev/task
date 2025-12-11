"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePageAccess } from '@/lib/hooks/use-page-access';
import type { PageName } from '@/lib/page-access';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Building2,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navigation: Array<{
  name: string;
  href: string;
  icon: LucideIcon;
  page: PageName;
}> = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare, page: 'tasks' },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban, page: 'projects' },
  { name: 'Team', href: '/dashboard/team', icon: Users, page: 'team' },
  { name: 'Clients', href: '/dashboard/clients', icon: Building2, page: 'clients' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, page: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasAccess, loading } = usePageAccess();

  // Show loading skeleton
  if (loading) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">TaskFlow</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">TaskFlow</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          // ซ่อนเมนูที่ไม่มีสิทธิ์
          if (!hasAccess(item.page)) {
            return null;
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
