"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { updateProject, deleteProject } from '@/app/actions/projects';
import { UserMultiSelect } from '@/components/ui/user-multi-select';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Database } from '@/database.types';
import type { User } from '@/lib/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

interface EditProjectFormProps {
  project: ProjectRow;
  clients: Array<{ id: string; name: string }>;
  users: User[];
  initialSalesPersonIds: string[];
  initialAeIds: string[];
}

export function EditProjectForm({
  project,
  clients,
  users,
  initialSalesPersonIds,
  initialAeIds,
}: EditProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [salesPersonIds, setSalesPersonIds] = useState<string[]>(initialSalesPersonIds);
  const [aeIds, setAeIds] = useState<string[]>(initialAeIds);
  const [formData, setFormData] = useState({
    name: project.name || '',
    client_id: project.client_id || '',
    status: (project.status || 'active') as 'active' | 'on_hold' | 'done',
    qt_link: project.qt_link || '',
    brief_link: project.brief_link || '',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    internal_notes: project.internal_notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        client_id: formData.client_id || null,
        qt_link: formData.qt_link || null,
        brief_link: formData.brief_link || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        internal_notes: formData.internal_notes || null,
        sales_person_ids: salesPersonIds,
        ae_ids: aeIds,
      };

      const result = await updateProject(project.id, dataToSubmit);

      if (result.success) {
        toast.success('Project updated successfully!');
        router.push(`/dashboard/projects/${project.id}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update project');
      }
    } catch (error) {
      toast.error('Failed to update project');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject(project.id);

      if (result.success) {
        toast.success('Project deleted successfully');
        router.push('/dashboard/projects');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <Label htmlFor="client_id">Client</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sales_persons">Sales Persons</Label>
              <UserMultiSelect
                users={users}
                selectedUserIds={salesPersonIds}
                onSelectionChange={setSalesPersonIds}
                placeholder="Select sales persons..."
              />
            </div>

            <div>
              <Label htmlFor="account_executives">Account Executives</Label>
              <UserMultiSelect
                users={users}
                selectedUserIds={aeIds}
                onSelectionChange={setAeIds}
                placeholder="Select AEs..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qt_link">QT Link</Label>
              <Input
                id="qt_link"
                value={formData.qt_link}
                onChange={(e) => setFormData({ ...formData, qt_link: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="brief_link">Brief Link</Label>
              <Input
                id="brief_link"
                value={formData.brief_link}
                onChange={(e) => setFormData({ ...formData, brief_link: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'on_hold' | 'done') =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Internal notes about this project..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading || isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
              All tasks associated with this project will also be affected.
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
    </>
  );
}
