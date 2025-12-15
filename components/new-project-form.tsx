"use client";

import { useState, useEffect } from 'react';
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
import { createProject, fetchPipelineStages } from '@/app/actions/projects';
import { UserMultiSelect } from '@/components/ui/user-multi-select';
import { toast } from 'sonner';

interface NewProjectFormProps {
  clients: Array<{ id: string; name: string }>;
  users: Array<{ id: string; full_name: string; email?: string }>;
  onSuccess?: () => void;
}

interface PipelineStage {
  id: string;
  name: string;
  order_index: number;
  color: string | null;
}

export function NewProjectForm({ clients, users, onSuccess }: NewProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [salesPersonIds, setSalesPersonIds] = useState<string[]>([]);
  const [aeIds, setAeIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    client_id: string;
    pipeline_stage_id: string;
    status: 'active' | 'on_hold' | 'done';
    qt_link: string;
    brief_link: string;
    start_date: string;
    end_date: string;
    internal_notes: string;
  }>({
    name: '',
    client_id: '',
    pipeline_stage_id: '',
    status: 'active',
    qt_link: '',
    brief_link: '',
    start_date: '',
    end_date: '',
    internal_notes: '',
  });

  useEffect(() => {
    async function loadPipelineStages() {
      const result = await fetchPipelineStages();
      if (result.success && result.data) {
        setPipelineStages(result.data);
      }
    }
    loadPipelineStages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        client_id: formData.client_id || null,
        pipeline_stage_id: formData.pipeline_stage_id || null,
        qt_link: formData.qt_link || null,
        brief_link: formData.brief_link || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        internal_notes: formData.internal_notes || null,
        sales_person_ids: salesPersonIds,
        ae_ids: aeIds,
      };

      const result = await createProject(dataToSubmit);

      if (result.success) {
        toast.success('Project created successfully!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/projects');
        }
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create project');
      }
    } catch (error) {
      toast.error('Failed to create project');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <Label htmlFor="pipeline_stage_id">Pipeline Stage</Label>
            <Select
              value={formData.pipeline_stage_id}
              onValueChange={(value) => setFormData({ ...formData, pipeline_stage_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {pipelineStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
