import { createClient } from '@/lib/supabase-server';
import { NewProjectForm } from '@/components/new-project-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewProjectPage() {
  const supabase = await createClient();

  const [clientsResult, usersResult] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('users').select('id, full_name').eq('is_active', true).order('full_name'),
  ]);

  const clients = clientsResult.data || [];
  const users = usersResult.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">
          Add a new project to track client work and tasks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewProjectForm clients={clients} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
