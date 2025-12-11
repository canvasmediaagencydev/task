import { ClientsPageClient } from '@/components/clients-page-client';
import { fetchClientsOverview } from '@/lib/clients-data';
import { PageGuard } from '@/components/page-guard';

export default async function ClientsPage() {
  const { clients } = await fetchClientsOverview();

  return (
    <PageGuard page="clients">
      <ClientsPageClient clients={clients} />
    </PageGuard>
  );
}
