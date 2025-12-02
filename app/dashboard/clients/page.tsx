import { ClientsPageClient } from '@/components/clients-page-client';
import { fetchClientsOverview } from '@/lib/clients-data';

export default async function ClientsPage() {
  const { clients, isMock } = await fetchClientsOverview();

  return <ClientsPageClient clients={clients} isMock={isMock} />;
}
