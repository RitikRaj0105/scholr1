import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertCircle, Ban, UserCheck, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Avatar } from '@/components/social/Avatar';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

type Role = 'STUDENT' | 'TEACHER' | 'PARENT' | 'SCHOOL_ADMIN' | 'COLLEGE_ADMIN' | 'RECRUITER' | 'SUPER_ADMIN';

interface UserRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: Role;
  subscriptionTier: string;
  createdAt: string;
  suspendedAt: string | null;
  suspendedUntil: string | null;
  suspendedReason: string | null;
}

const ROLE_COLOR: Record<string, string> = {
  STUDENT: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  TEACHER: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  PARENT: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  RECRUITER: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  SCHOOL_ADMIN: 'bg-red-500/10 text-red-300 border-red-500/20',
  COLLEGE_ADMIN: 'bg-red-500/10 text-red-300 border-red-500/20',
  SUPER_ADMIN: 'bg-red-500/15 text-red-200 border-red-500/30',
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<UserRow | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDays, setSuspendDays] = useState<string>('');

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users', roleFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (search) params.set('search', search);
      return (await api.get(`/admin/users?${params.toString()}`)).data.users;
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) =>
      (await api.patch(`/admin/users/${userId}/role`, { role })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to change role'
      );
    },
  });

  const suspend = useMutation({
    mutationFn: () => {
      if (!suspendTarget) throw new Error('no target');
      return api.post(`/admin/users/${suspendTarget.id}/suspend`, {
        reason: suspendReason,
        ...(suspendDays ? { durationDays: parseInt(suspendDays) } : {}),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setSuspendTarget(null);
      setSuspendReason('');
      setSuspendDays('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to suspend');
    },
  });

  const unsuspend = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/unsuspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">
            Admin
          </p>
          <h1 className="font-display text-3xl text-bone-50">
            Users
            <span className="text-bone-400 text-xl ml-2 font-mono">
              {users.length}
            </span>
          </h1>
        </motion.div>

        {error && (
          <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-10 pr-4 py-2 bg-ink-900/60 border border-white/[0.06] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')}
            className="px-3 py-2 bg-ink-900/60 border border-white/[0.06] rounded-lg text-sm text-bone-50 focus:outline-none focus:border-violet-500/40"
          >
            <option value="ALL">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="SCHOOL_ADMIN">School Admins</option>
            <option value="COLLEGE_ADMIN">College Admins</option>
            <option value="SUPER_ADMIN">Super Admins</option>
            <option value="RECRUITER">Recruiters</option>
            <option value="PARENT">Parents</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 overflow-hidden">
          {isLoading && (
            <div className="p-12 text-center text-bone-400 text-sm">
              Loading users…
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <div className="p-12 text-center text-bone-400 text-sm">
              No users match your filters.
            </div>
          )}

          {users.length > 0 && (
            <div className="divide-y divide-white/[0.04]">
              <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider text-bone-400 font-medium bg-white/[0.02]">
                <div className="col-span-5">User</div>
                <div className="col-span-2">Tier</div>
                <div className="col-span-1">Joined</div>
                <div className="col-span-2 text-right">Role</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              {users.map((u, i) => {
                const isSelf = u.id === me?.id;
                const selfIsAdmin = u.id === me?.id && ['SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].includes(u.role);
                const isSuspended = !!u.suspendedAt && (!u.suspendedUntil || new Date(u.suspendedUntil) > new Date());
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.015 }}
                    className={`grid grid-cols-12 gap-3 px-5 py-3 items-center transition-colors ${
                      isSuspended ? 'bg-red-500/[0.04]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="col-span-5 min-w-0 flex items-center gap-3">
                      <Avatar user={u} size={32} />
                      <div className="min-w-0">
                        <div className="text-sm text-bone-100 truncate">
                          {u.firstName || u.lastName
                            ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                            : u.email.split('@')[0]}
                          {isSelf && (
                            <span className="ml-2 text-[10px] text-violet-400">
                              (you)
                            </span>
                          )}
                          {isSuspended && (
                            <span className="ml-2 text-[10px] text-red-400">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-bone-400 truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-bone-300 capitalize">
                      {u.subscriptionTier.toLowerCase()}
                    </div>
                    <div className="col-span-1 text-xs text-bone-400 font-mono">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          setRole.mutate({
                            userId: u.id,
                            role: e.target.value as Role,
                          })
                        }
                        disabled={selfIsAdmin}
                        title={selfIsAdmin ? "Can't demote yourself — ask another admin" : ''}
                        className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wider font-medium focus:outline-none focus:border-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed ${
                          ROLE_COLOR[u.role] || ROLE_COLOR.STUDENT
                        }`}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="PARENT">PARENT</option>
                        <option value="RECRUITER">RECRUITER</option>
                        <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                        <option value="COLLEGE_ADMIN">COLLEGE_ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {!isSelf && !['SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].includes(u.role) && (
                        isSuspended ? (
                          <button
                            onClick={() => unsuspend.mutate(u.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-emerald-500/30 text-emerald-300 text-[10px] hover:bg-emerald-500/10 transition-colors"
                          >
                            <UserCheck className="w-2.5 h-2.5" />
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendTarget(u)}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-white/[0.06] text-bone-400 text-[10px] hover:text-red-400 hover:border-red-500/30 transition-colors"
                          >
                            <Ban className="w-2.5 h-2.5" />
                            Suspend
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-violet-500/[0.05] border border-violet-500/15">
          <ShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-bone-300 leading-relaxed">
            Changing a user's role takes effect immediately. They may need to log out and log back in to see the new permissions in their interface. You cannot demote yourself from an admin role — ask another admin.
          </p>
        </div>
      </div>

      {/* Suspend modal */}
      <AnimatePresence>
        {suspendTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSuspendTarget(null)}
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-red-500/20 bg-ink-900 p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-5 h-5 text-red-400" />
                <h3 className="font-display text-xl text-bone-50">Suspend user</h3>
              </div>
              <p className="text-sm text-bone-300 mb-4">
                Suspending <span className="text-bone-100">{suspendTarget.firstName || suspendTarget.email}</span> will prevent them from logging in.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1.5 font-medium">
                    Reason (required)
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g., Repeated harassment after warnings"
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-red-500/40 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1.5 font-medium">
                    Duration (days, leave empty for permanent)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(e.target.value)}
                    placeholder="Empty = permanent"
                    className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-red-500/40"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setSuspendTarget(null)}
                  className="flex-1 py-2 rounded-lg border border-white/[0.08] text-bone-300 text-sm hover:bg-white/[0.02] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => suspend.mutate()}
                  disabled={!suspendReason.trim() || suspend.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {suspend.isPending ? 'Suspending…' : 'Suspend'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
