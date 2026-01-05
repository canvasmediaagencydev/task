"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Task, TaskType, TaskStatus, TaskPriority, User } from '@/lib/types';
import { updateTask } from '@/app/actions/tasks';
import { UserMultiSelect } from '@/components/ui/user-multi-select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface EditTaskFormProps {
  task: Task;
  users: User[];
}

export function EditTaskForm({ task, users }: EditTaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task.assignees?.map(u => u.id) || []
  );
  const [reviewerIds, setReviewerIds] = useState<string[]>(
    task.reviewers?.map(u => u.id) || []
  );
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    type: task.type as TaskType,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    due_date: task.due_date || '',
    month: task.month ? task.month.substring(0, 7) : '',  // Convert YYYY-MM-DD to YYYY-MM
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    startTransition(async () => {
      const result = await updateTask(task.id, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        month: formData.month ? `${formData.month}-01` : null,
        assignee_ids: assigneeIds,
        reviewer_ids: reviewerIds,
      });

      if (result.success) {
        toast.success('Task updated successfully');
        router.push(`/dashboard/tasks/${task.id}`);
      } else {
        toast.error('Failed to update task');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardTitle>Edit Task Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter task title"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter task description"
              rows={4}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TaskType) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
