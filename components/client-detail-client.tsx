"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Mail, Phone, Building2, User, Calendar, ExternalLink, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { deleteClient } from '@/app/actions/clients';
import { toast } from 'sonner';
import type { Database } from '@/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type ProjectRow = Database['public']['Tables']['projects']['Row'] & {
  sales_person: Database['public']['Tables']['users']['Row'] | null;
  ae: Database['public']['Tables']['users']['Row'] | null;
  pipeline_stage: Database['public']['Tables']['pipeline_stages']['Row'] | null;
};

interface ClientDetailClientProps {
  client: ClientRow;
  projects: ProjectRow[];
}

export function ClientDetailClient({ client, projects }: ClientDetailClientProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'done');

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClient(client.id);

      if (result.success) {
        toast.success('Client deleted successfully');
        router.push('/dashboard/clients');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete client');
      }
    });
  };

  const getStatusBadge = (status?: string | null) => {
    const normalizedStatus = status ?? 'active';
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: 'default',
      on_hold: 'secondary',
      done: 'outline',
    };
    return (
      <Badge variant={variants[normalizedStatus] || 'default'}>
        {normalizedStatus.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            {client.company_name && (
              <p className="text-muted-foreground">{client.company_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{projects.length}</p>
            <p className="text-sm text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeProjects.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{completedProjects.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.contact_person && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{client.contact_person}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${client.email}`} className="font-medium hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${client.phone}`} className="font-medium hover:underline">
                    {client.phone}
                  </a>
                </div>
              </div>
            )}

            {client.company_name && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{client.company_name}</p>
                </div>
              </div>
            )}

            {client.created_at && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client Since</p>
                  <p className="font-medium">{format(new Date(client.created_at), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {client.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{client.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Button onClick={() => router.push(`/dashboard/projects/new?client_id=${client.id}`)}>
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No projects yet. Create the first project for this client.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{project.name}</h3>
                      {getStatusBadge(project.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {project.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(project.start_date), 'MMM dd, yyyy')}
                        </span>
                      )}
                      {project.ae && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {project.ae.full_name}
                        </span>
                      )}
                      {project.pipeline_stage && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: project.pipeline_stage.color || '#3b82f6' }}
                        >
                          {project.pipeline_stage.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{client.name}"? This action cannot be undone.
              {projects.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This client has {projects.length} associated project{projects.length > 1 ? 's' : ''}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
