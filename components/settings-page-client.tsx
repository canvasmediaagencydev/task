"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUsersWithPageAccess, updateUserPageAccess } from '@/app/actions/page-access';
import { createUserByAdmin, deleteUserByAdmin } from '@/app/actions/auth';
import type { PageName } from '@/lib/page-access';

interface UserWithAccess {
  id: string;
  full_name: string;
  email: string;
  pages: PageName[];
}

interface SettingsPageClientProps {
  initialUsers: UserWithAccess[];
}

const ALL_PAGES: PageName[] = ['dashboard', 'tasks', 'projects', 'team', 'clients', 'settings'];

const PAGE_LABELS: Record<PageName, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  projects: 'Projects',
  team: 'Team',
  clients: 'Clients',
  settings: 'Settings',
};

export function SettingsPageClient({ initialUsers }: SettingsPageClientProps) {
  const [users, setUsers] = useState<UserWithAccess[]>(initialUsers);
  const [loading, setLoading] = useState(false);

  // User creation state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPages, setNewUserPages] = useState<PageName[]>([]);

  // Edit page access state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<PageName[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const usersRes = await fetchUsersWithPageAccess();

    if (usersRes.success) {
      setUsers((usersRes.data || []) as UserWithAccess[]);
    }

    setLoading(false);
  }, []);

  async function handleCreateUser() {
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserFullName.trim()) {
      toast.error('All fields are required');
      return;
    }

    const result = await createUserByAdmin(
      newUserEmail,
      newUserPassword,
      newUserFullName
    );

    if (result.success) {
      // Assign page access if any selected
      if (newUserPages.length > 0 && result.data?.id) {
        await updateUserPageAccess(result.data.id, newUserPages);
      }

      toast.success('User created successfully');
      setUserDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserPages([]);
      void loadData();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteUserByAdmin(userId);

    if (result.success) {
      toast.success('User deleted successfully');
      void loadData();
    } else {
      toast.error(result.error);
    }
  }

  function handleEditPageAccess(user: UserWithAccess) {
    setEditingUserId(user.id);
    setSelectedPages(user.pages || []);
    setEditDialogOpen(true);
  }

  async function handleSavePageAccess() {
    if (!editingUserId) return;

    const result = await updateUserPageAccess(editingUserId, selectedPages);

    if (result.success) {
      toast.success('Page access updated');
      setEditDialogOpen(false);
      setEditingUserId(null);
      setSelectedPages([]);
      void loadData();
    } else {
      toast.error(result.error);
    }
  }

  function togglePage(page: PageName, stateUpdater: (pages: PageName[]) => void, currentPages: PageName[]) {
    if (currentPages.includes(page)) {
      stateUpdater(currentPages.filter(p => p !== page));
    } else {
      stateUpdater([...currentPages, page]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage users and page access</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users & Page Access</CardTitle>
              <CardDescription>
                {users.length} user{users.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={() => setUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Page Access</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="p-4">{user.full_name}</td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {user.pages && user.pages.length > 0 ? (
                        user.pages.map((page: PageName) => (
                          <span
                            key={page}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                          >
                            {PAGE_LABELS[page]}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No access</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPageAccess(user)}
                        aria-label="Edit page access"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Invite a new teammate and set their page access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Page Access</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PAGES.map((page) => (
                  <label key={page} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={newUserPages.includes(page)}
                      onCheckedChange={() =>
                        togglePage(page, setNewUserPages, newUserPages)
                      }
                    />
                    {PAGE_LABELS[page]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Page Access</DialogTitle>
            <DialogDescription>Choose which pages this user can access.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PAGES.map((page) => (
              <label key={page} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedPages.includes(page)}
                  onCheckedChange={() =>
                    togglePage(page, setSelectedPages, selectedPages)
                  }
                />
                {PAGE_LABELS[page]}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePageAccess}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
