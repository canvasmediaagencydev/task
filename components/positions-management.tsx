'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPosition,
  updatePosition,
  deletePosition,
} from '@/app/actions/positions';
import type { Database } from '@/database.types';

type Position = Database['public']['Tables']['positions']['Row'];

interface PositionsManagementProps {
  initialPositions: Position[];
}

export function PositionsManagement({ initialPositions }: PositionsManagementProps) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
    });
    setEditingPosition(null);
  }

  function handleEdit(position: Position) {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      description: position.description || '',
      color: position.color || '#3b82f6',
    });
    setDialogOpen(true);
  }

  function handleAddNew() {
    resetForm();
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('Position name is required');
      return;
    }

    if (editingPosition) {
      // Update existing position
      const result = await updatePosition(editingPosition.id, {
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
      });

      if (result.success) {
        toast.success('Position updated successfully');
        setPositions(positions.map(p => p.id === editingPosition.id ? result.data! : p));
        setDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || 'Failed to update position');
      }
    } else {
      // Create new position
      const result = await createPosition({
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
      });

      if (result.success) {
        toast.success('Position created successfully');
        setPositions([...positions, result.data!]);
        setDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || 'Failed to create position');
      }
    }
  }

  async function handleDelete(position: Position) {
    if (!confirm(`Are you sure you want to delete "${position.name}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deletePosition(position.id);

    if (result.success) {
      toast.success('Position deleted successfully');
      setPositions(positions.filter(p => p.id !== position.id));
    } else {
      toast.error(result.error || 'Failed to delete position');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Position Types</CardTitle>
              <CardDescription>
                Manage position types for team members
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Position
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4">Position</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Color</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    No positions yet. Add your first position.
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.id} className="border-b last:border-0">
                    <td className="p-4">
                      <span className="font-medium">{position.name}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {position.description || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: position.color || '#3b82f6' }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {position.color || '#3b82f6'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(position)}
                          aria-label="Edit position"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(position)}
                          aria-label="Delete position"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? 'Edit Position' : 'Add Position'}
            </DialogTitle>
            <DialogDescription>
              {editingPosition
                ? 'Update position details'
                : 'Create a new position type for team members'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Position Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Designer, Developer, Project Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this position..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPosition ? 'Save Changes' : 'Create Position'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
