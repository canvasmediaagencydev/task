"use client";

import { User } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserSelectProps {
  users: User[];
  value?: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserSelect({
  users,
  value,
  onValueChange,
  placeholder = "Select user",
  disabled = false
}: UserSelectProps) {
  return (
    <Select
      value={value || 'unassigned'}
      onValueChange={(val) => onValueChange(val === 'unassigned' ? '' : val)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                <AvatarFallback className="text-xs">
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span>{user.full_name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
