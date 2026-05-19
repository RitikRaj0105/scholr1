import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  Code2,
  BookOpen,
  Activity,
  Target,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';

interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalExams: number;
  totalSubmissions: number;
  totalCodeSubmissions: number;
  totalFocusSessions: number;
  byRole: Record<string, number>;
  byDifficulty: Record<string, number>;
  recentSignups: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    createdAt: string;
  }[];
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

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data.stats,
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-end justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">
              Admin
            </p>
            <h1 className="font-display text-3xl text-bone-50">
              Operations <span className="text-violet-400">center.</span>
            </h1>
          </div>
          <Link
            to="/admin/problems/new"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New problem
          </Link>
        </motion.div>

        {isLoading && (
          <div className="text-bone-400 text-sm">Loading stats…</div>
        )}

        {stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard
                label="Users"
                value={stats.totalUsers}
                icon={<Users className="w-4 h-4" />}
                accent="cyan"
                delay={0}
              />
              <StatCard
                label="Problems"
                value={stats.totalProblems}
                icon={<Code2 className="w-4 h-4" />}
                accent="violet"
                delay={0.05}
              />
              <StatCard
                label="Exams"
                value={stats.totalExams}
                icon={<BookOpen className="w-4 h-4" />}
                accent="emerald"
                delay={0.1}
              />
              <StatCard
                label="Total submissions"
                value={stats.totalCodeSubmissions + stats.totalSubmissions}
                icon={<Activity className="w-4 h-4" />}
                accent="amber"
                delay={0.15}
              />
            </div>

            {/* Two-column */}
            <div className="grid grid-cols-12 gap-4">
              {/* Recent signups */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="col-span-12 lg:col-span-8 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-bone-50">
                    Recent signups
                  </h3>
                  <Link
                    to="/admin/users"
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    All users <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1">
                  {stats.recentSignups.length === 0 && (
                    <p className="text-sm text-bone-400 text-center py-6">
                      No signups yet
                    </p>
                  )}
                  {stats.recentSignups.map((u, i) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + i * 0.03 }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-bone-100 truncate">
                          {u.firstName || u.lastName
                            ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                            : u.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-bone-400 truncate">
                          {u.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-medium ${
                            ROLE_COLOR[u.role] || ROLE_COLOR.STUDENT
                          }`}
                        >
                          {u.role}
                        </span>
                        <span className="text-xs text-bone-400 font-mono">
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Breakdowns */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="col-span-12 lg:col-span-4 space-y-4"
              >
                {/* By role */}
                <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5">
                  <h3 className="font-display text-base text-bone-50 mb-3">
                    Users by role
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byRole).map(([role, count]) => (
                      <div
                        key={role}
                        className="flex items-center justify-between"
                      >
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-medium ${
                            ROLE_COLOR[role] || ROLE_COLOR.STUDENT
                          }`}
                        >
                          {role}
                        </span>
                        <span className="text-sm font-mono text-bone-100">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By difficulty */}
                <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5">
                  <h3 className="font-display text-base text-bone-50 mb-3">
                    Problems by difficulty
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byDifficulty).map(([diff, count]) => (
                      <div
                        key={diff}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-bone-300">{diff}</span>
                        <span className="text-sm font-mono text-bone-100">
                          {count}
                        </span>
                      </div>
                    ))}
                    {Object.keys(stats.byDifficulty).length === 0 && (
                      <p className="text-xs text-bone-400">No problems yet</p>
                    )}
                  </div>
                </div>

                {/* Focus sessions */}
                <div className="rounded-2xl border border-violet-500/15 bg-ink-900/60 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-violet-400 uppercase tracking-wider font-medium">
                      Total focus sessions
                    </span>
                  </div>
                  <div className="font-mono text-3xl text-bone-50 font-semibold">
                    {stats.totalFocusSessions.toLocaleString()}
                  </div>
                  <p className="text-xs text-bone-400 mt-1">
                    Across all users
                  </p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

const StatCard = ({
  label,
  value,
  icon,
  accent,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'cyan' | 'violet' | 'emerald' | 'amber';
  delay: number;
}) => {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colors[accent]}`}
        >
          {icon}
        </div>
      </div>
      <div className="font-mono text-2xl text-bone-50 font-semibold tabular-nums leading-none">
        {value.toLocaleString()}
      </div>
      <p className="text-[11px] text-bone-400 uppercase tracking-wider mt-2 font-medium">
        {label}
      </p>
    </motion.div>
  );
}
