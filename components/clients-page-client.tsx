"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClientSummary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Building2, Mail, Phone, UserPlus, Search, ClipboardList } from 'lucide-react';

interface ClientsPageClientProps {
  clients: ClientSummary[];
}

export function ClientsPageClient({ clients }: ClientsPageClientProps) {
  const router = useRouter();
  const stats = useMemo(() => {
    const total = clients.length;
    const retained = clients.filter((client) => (client.project_count || 0) > 1).length;
    const openInitiatives = clients.reduce((sum, client) => sum + (client.project_count || 0), 0);

    return {
      total,
      retained,
      openInitiatives,
    };
  }, [clients]);

  const highlightedClients = clients.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Accounts</p>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Track key contacts, conversations, and live engagements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Export list
          </Button>
          <Button className="gap-2" onClick={() => router.push('/dashboard/clients/new')}>
            <UserPlus className="h-4 w-4" />
            New client
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total clients" value={`${stats.total}`} helper="All accounts in workspace" />
        <StatCard label="Retained accounts" value={`${stats.retained}`} helper="More than one active project" />
        <StatCard label="Open initiatives" value={`${stats.openInitiatives}`} helper="Project count across clients" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="rounded-3xl border bg-card/80 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-xl">Client directory</CardTitle>
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search clients..." className="pl-9" disabled />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {clients.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Primary contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Projects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{client.company_name || client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.notes || 'No notes added yet.'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{client.contact_person || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{client.email || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{client.phone || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{client.project_count ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No clients yet.</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Key contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {highlightedClients.map((client) => (
                <div key={client.id} className="rounded-2xl border bg-muted/50 p-4 text-sm">
                  <p className="font-medium">{client.contact_person || client.name}</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {client.email || 'Not provided'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {client.phone || 'Not provided'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {client.company_name || client.name}
                    </p>
                  </div>
                </div>
              ))}
              {!highlightedClients.length && (
                <p className="text-sm text-muted-foreground">Add clients to see their contact cards here.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
}

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-card/70 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}
