"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TaskType, TaskStatus, TaskPriority, User } from '@/lib/types';
import { createTask } from '@/app/actions/tasks';
import { UserMultiSelect } from '@/components/ui/user-multi-select';
import { toast } from 'sonner';
import { ArrowLeft, FileText, X, Link as LinkIcon } from 'lucide-react';

type LinkAttachment = {
  title: string;
  url: string;
  provider_type: 'google_drive' | 'google_docs' | 'google_sheets' | 'canva' | 'figma' | 'other';
};

interface NewTaskFormProps {
  users: User[];
  projects: Array<{ id: string; name: string }>;
  initialProjectId?: string;
}

export function NewTaskForm({ users, projects, initialProjectId }: NewTaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkAttachment[]>([]);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newLink, setNewLink] = useState<LinkAttachment>({
    title: '',
    url: '',
    provider_type: 'other',
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'other' as TaskType,
    status: 'backlog' as TaskStatus,
    priority: 'normal' as TaskPriority,
    due_date: '',
    month: '',
    project_id: initialProjectId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.project_id) {
      toast.error('Project is required');
      return;
    }

    startTransition(async () => {
      const result = await createTask({
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        month: formData.month ? `${formData.month}-01` : null,
        project_id: formData.project_id,
        assignee_ids: assigneeIds,
        reviewer_ids: reviewerIds,
        links: links.length > 0 ? links : undefined,
      });

      if (result.success) {
        toast.success('Task created successfully');
        router.push('/dashboard/tasks');
      } else {
        toast.error('Failed to create task');
      }
    });
  };

  const addLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error('Link title and URL are required');
      return;
    }

    setLinks([...links, newLink]);
    setNewLink({ title: '', url: '', provider_type: 'other' });
    setShowLinkForm(false);
    toast.success('Link added');
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
    toast.success('Link removed');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) =>
                setFormData({ ...formData, project_id: value })
              }
              required
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="" disabled>
                    No active projects available
                  </SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TaskType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="graphic">Graphic</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="posting">Posting</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="vdo">VDO</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="motion">Motion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_review">Waiting Review</SelectItem>
                  <SelectItem value="sent_client">Sent to Client</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={formData.month}
                onChange={(e) =>
                  setFormData({ ...formData, month: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignees">Assignees</Label>
            <UserMultiSelect
              users={users}
              selectedUserIds={assigneeIds}
              onSelectionChange={setAssigneeIds}
              placeholder="Select assignees..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewers">Reviewers</Label>
            <UserMultiSelect
              users={users}
              selectedUserIds={reviewerIds}
              onSelectionChange={setReviewerIds}
              placeholder="Select reviewers..."
            />
          </div>

          {/* Links Section */}
          <div className="space-y-2">
            <Label>Links & Attachments (Optional)</Label>

            {/* Display added links */}
            {links.length > 0 && (
              <div className="space-y-2 border rounded-md p-3 bg-muted/50">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{link.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new link form */}
            {showLinkForm && (
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="link-title">Link Title *</Label>
                    <Input
                      id="link-title"
                      placeholder="e.g., Brand Guidelines, Campaign Assets"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-url">URL *</Label>
                    <Input
                      id="link-url"
                      type="url"
                      placeholder="https://..."
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-type">Link Type</Label>
                    <Select
                      value={newLink.provider_type}
                      onValueChange={(value: LinkAttachment['provider_type']) =>
                        setNewLink({ ...newLink, provider_type: value })
                      }
                    >
                      <SelectTrigger id="link-type">
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
                  <div className="flex gap-2">
                    <Button type="button" onClick={addLink} size="sm">
                      Add Link
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowLinkForm(false);
                        setNewLink({ title: '', url: '', provider_type: 'other' });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Add Link button */}
            {!showLinkForm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLinkForm(true)}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Add Link
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
