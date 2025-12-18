import { PageGuard } from '@/components/page-guard';
import { fetchUsersWithPageAccess } from '@/app/actions/page-access';
import { fetchPositions } from '@/app/actions/positions';
import { SettingsPageClient } from '@/components/settings-page-client';
import type { PageName } from '@/lib/page-access';

export default async function SettingsPage() {
  const [initialUsersRes, positionsRes] = await Promise.all([
    fetchUsersWithPageAccess(),
    fetchPositions(),
  ]);

  const initialUsers = (initialUsersRes.success ? initialUsersRes.data : []) as Array<{
    id: string;
    full_name: string;
    email: string;
    pages: PageName[];
  }>;

  const initialPositions = positionsRes.success ? positionsRes.data : [];

  return (
    <PageGuard page="settings">
      <SettingsPageClient initialUsers={initialUsers} initialPositions={initialPositions} />
    </PageGuard>
  );
}
