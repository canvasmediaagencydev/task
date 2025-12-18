import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { EditClientForm } from '@/components/edit-client-form';
import type { Database } from '@/database.types';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Client</h1>
        <p className="text-muted-foreground">
          Update client information
        </p>
      </div>

      <EditClientForm client={client} />
    </div>
  );
}
