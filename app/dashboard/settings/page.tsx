import { PageGuard } from '@/components/page-guard';
import { fetchUsersWithPageAccess } from '@/app/actions/page-access';
import { SettingsPageClient } from '@/components/settings-page-client';
import type { PageName } from '@/lib/page-access';

export default async function SettingsPage() {
  const initialUsersRes = await fetchUsersWithPageAccess();
  const initialUsers = (initialUsersRes.success ? initialUsersRes.data : []) as Array<{
    id: string;
    full_name: string;
    email: string;
    pages: PageName[];
  }>;

  return (
    <PageGuard page="settings">
      <SettingsPageClient initialUsers={initialUsers} />
    </PageGuard>
  );
}
