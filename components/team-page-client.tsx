"use client";

import { TeamMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamPageClientProps {
  team: TeamMember[];
  isMock?: boolean;
}

export function TeamPageClient({ team, isMock }: TeamPageClientProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Team Directory</p>
        <h1 className="text-3xl font-bold">Team Members</h1>
        <p className="text-muted-foreground">Simple roster of everyone currently active on the workspace.</p>
        {isMock && (
          <p className="text-xs text-muted-foreground">
            Showing mock roster data until Supabase users are connected.
          </p>
        )}
      </div>

      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Team roster</CardTitle>
        </CardHeader>
        <CardContent>
          {team.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                          <AvatarFallback>{member.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-tight">{member.full_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.role || '–'}</TableCell>
                    <TableCell className="text-muted-foreground">{member.department || '–'}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell className="text-muted-foreground">{member.location || '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              No team members yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
