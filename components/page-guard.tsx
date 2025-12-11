'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageAccess } from '@/lib/hooks/use-page-access';
import type { PageName } from '@/lib/page-access';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PageGuardProps {
  page: PageName;
  children: React.ReactNode;
}

export function PageGuard({ page, children }: PageGuardProps) {
  const { hasAccess, loading } = usePageAccess();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasAccess(page)) {
      // Redirect to dashboard if no access
      router.push('/dashboard');
    }
  }, [loading, hasAccess, page, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasAccess(page)) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
