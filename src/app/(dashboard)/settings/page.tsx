'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Shield, Loader2, LogOut, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Profile, UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'viewer', label: 'Viewer' },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatedRoles, setUpdatedRoles] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?pageSize=50');
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentProfile(profile as Profile);
          const admin = profile.role === 'admin';
          setIsAdmin(admin);
          if (admin) {
            await fetchUsers();
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [supabase, fetchUsers]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setUpdatedRoles((prev) => ({ ...prev, [userId]: true }));
        setTimeout(() => {
          setUpdatedRoles((prev) => ({ ...prev, [userId]: false }));
        }, 2000);
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gold">Settings</h1>
        <p className="mt-1 text-foreground-muted">Account and system settings</p>
      </div>

      {/* My Profile */}
      <div className="rounded-lg border border-border bg-background-secondary p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">My Profile</h2>
        {currentProfile && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-xl font-bold text-gold">
                {currentProfile.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {currentProfile.full_name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={currentProfile.role}>{currentProfile.role}</Badge>
                  <span className="text-sm text-foreground-muted">
                    Member since {format(new Date(currentProfile.created_at), 'MMMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg border border-border bg-background-tertiary px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* User Management */}
      {isAdmin ? (
        <div className="rounded-lg border border-border bg-background-secondary p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-foreground-muted">
                  <th className="pb-3 pr-4 font-medium">User</th>
                  <th className="pb-3 pr-4 font-medium">Current Role</th>
                  <th className="pb-3 pr-4 font-medium">Change Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                          {user.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-foreground">
                          {user.full_name}
                          {user.id === currentProfile?.id && (
                            <span className="ml-2 text-xs text-foreground-muted">(You)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={user.role}>{user.role}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {user.id === currentProfile?.id ? (
                        <span className="text-xs text-foreground-muted">
                          Cannot change own role
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value as UserRole)
                            }
                            disabled={updatingRole === user.id}
                            className="rounded-md border border-border bg-background-tertiary px-2 py-1 text-sm text-foreground"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {updatingRole === user.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-gold" />
                          )}
                          {updatedRoles[user.id] && (
                            <Check className="h-4 w-4 text-success" />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-foreground-muted">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background-secondary p-6">
          <div className="flex items-center gap-3 text-foreground-muted">
            <Shield className="h-5 w-5" />
            <p>User management is only available to administrators.</p>
          </div>
        </div>
      )}
    </div>
  );
}
