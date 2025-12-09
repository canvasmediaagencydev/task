"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createAttachment } from '@/app/actions/attachments';

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'task' | 'project';
  entityId: string;
  onSuccess?: () => void;
}

export function AddLinkDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  onSuccess,
}: AddLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    provider_type: 'other' as
      | 'google_drive'
      | 'google_docs'
      | 'google_sheets'
      | 'canva'
      | 'figma'
      | 'other',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createAttachment({
        title: formData.title,
        url: formData.url,
        provider_type: formData.provider_type,
        entity_type: entityType,
        entity_id: entityId,
      });

      if (result.success) {
        toast.success('Link added successfully!');
        setFormData({ title: '', url: '', provider_type: 'other' });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to add link');
      }
    } catch (error) {
      toast.error('Failed to add link');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
          <DialogDescription>
            Add a link to Google Drive, Figma, Canva, or any other resource
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Brand Guidelines, Campaign Assets"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Link Type</Label>
              <Select
                value={formData.provider_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, provider_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="google_docs">Google Docs</SelectItem>
                  <SelectItem value="google_sheets">Google Sheets</SelectItem>
                  <SelectItem value="figma">Figma</SelectItem>
                  <SelectItem value="canva">Canva</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
