import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { EditProjectForm } from '@/components/edit-project-form';
import { mapSupabaseUser } from '@/lib/task-mapper';
import type { Database } from '@/database.types';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [projectResult, clientsResult, usersResult, salesPersonsResult, aesResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('clients')
      .select('id, name')
      .order('name'),
    supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('project_sales_persons')
      .select('user_id')
      .eq('project_id', id),
    supabase
      .from('project_account_executives')
      .select('user_id')
      .eq('project_id', id),
  ]);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data;
  const clients = clientsResult.data || [];
  const users = (usersResult.data || [])
    .map((user) => mapSupabaseUser(user))
    .filter((user): user is NonNullable<typeof user> => Boolean(user));

  const initialSalesPersonIds = (salesPersonsResult.data || []).map(row => row.user_id);
  const initialAeIds = (aesResult.data || []).map(row => row.user_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground">
          Update project information
        </p>
      </div>

      <EditProjectForm
        project={project}
        clients={clients}
        users={users}
        initialSalesPersonIds={initialSalesPersonIds}
        initialAeIds={initialAeIds}
      />
    </div>
  );
}
