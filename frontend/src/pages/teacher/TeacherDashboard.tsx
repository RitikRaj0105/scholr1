import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  Plus,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { api } from '@/lib/api';

interface ClassroomSummary {
  id: string;
  name: string;
  subject: string | null;
  code: string;
  createdAt: string;
  _count: { enrollments: number };
}

interface RecentEnrollment {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  classroom: { id: string; name: string };
}

interface TeacherStats {
  totalClassrooms: number;
  totalStudents: number;
  classrooms: ClassroomSummary[];
  recentEnrollments: RecentEnrollment[];
}

export default function TeacherDashboard() {
  const { data: stats, isLoading } = useQuery<TeacherStats>({
    queryKey: ['teacher-stats'],
    queryFn: async () => (await api.get('/teacher/stats')).data.stats,
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <TeacherLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-end justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
              Teacher
            </p>
            <h1 className="font-display text-3xl text-bone-50">
              Your <span className="text-emerald-400">classrooms.</span>
            </h1>
          </div>
          <Link
            to="/teacher/classrooms/new"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New classroom
          </Link>
        </motion.div>

        {isLoading && (
          <div className="text-bone-400 text-sm">Loading stats…</div>
        )}

        {stats && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <StatCard
                label="Classrooms"
                value={stats.totalClassrooms}
                icon={<GraduationCap className="w-4 h-4" />}
                accent="emerald"
                delay={0}
              />
              <StatCard
                label="Total students"
                value={stats.totalStudents}
                icon={<Users className="w-4 h-4" />}
                accent="cyan"
                delay={0.05}
              />
              <StatCard
                label="Active classes"
                value={stats.classrooms.length}
                icon={<BookOpen className="w-4 h-4" />}
                accent="violet"
                delay={0.1}
              />
            </div>

            <div className="grid grid-cols-12 gap-4">
              {/* Classrooms */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="col-span-12 lg:col-span-8 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-bone-50">
                    My classrooms
                  </h3>
                  <Link
                    to="/teacher/classrooms"
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {stats.classrooms.length === 0 ? (
                  <div className="rounded-lg bg-ink-800/40 p-8 text-center border border-white/[0.04]">
                    <GraduationCap className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
                    <p className="text-bone-300 text-sm mb-1">
                      No classrooms yet
                    </p>
                    <p className="text-bone-400 text-xs mb-4">
                      Create your first classroom — students can then join with the code
                    </p>
                    <Link
                      to="/teacher/classrooms/new"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create classroom
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.classrooms.slice(0, 5).map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.03 }}
                        className="group flex items-center justify-between px-3 py-3 rounded-lg bg-white/[0.02] hover:bg-emerald-500/[0.04] transition-colors"
                      >
                        <Link
                          to={`/teacher/classrooms/${c.id}`}
                          className="flex-1 min-w-0 flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-bone-100 truncate">
                              {c.name}
                            </div>
                            <div className="text-xs text-bone-400 truncate">
                              {c.subject && (
                                <>
                                  <span className="text-bone-300">
                                    {c.subject}
                                  </span>
                                  <span className="mx-1.5">·</span>
                                </>
                              )}
                              {c._count.enrollments} student
                              {c._count.enrollments === 1 ? '' : 's'}
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800 border border-white/[0.06] hover:border-emerald-500/30 transition-colors group/code"
                          title="Copy join code"
                        >
                          <span className="font-mono text-xs text-emerald-400 tracking-wider">
                            {c.code}
                          </span>
                          {copiedCode === c.code ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-bone-400 group-hover/code:text-bone-200 transition-colors" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent enrollments */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="col-span-12 lg:col-span-4 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5"
              >
                <h3 className="font-display text-lg text-bone-50 mb-4">
                  Recent joins
                </h3>
                {stats.recentEnrollments.length === 0 ? (
                  <p className="text-sm text-bone-400 text-center py-6">
                    No students joined yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentEnrollments.map((e, i) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 + i * 0.03 }}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-bone-100 truncate">
                            {e.user.firstName || e.user.lastName
                              ? `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim()
                              : e.user.email.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-bone-400 truncate">
                            {e.classroom.name}
                          </div>
                        </div>
                        <span className="text-[10px] text-bone-400 font-mono flex-shrink-0">
                          {new Date(e.joinedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </TeacherLayout>
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
  accent: 'emerald' | 'cyan' | 'violet';
  delay: number;
}) => {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4"
    >
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${colors[accent]}`}>
        {icon}
      </div>
      <div className="font-mono text-2xl text-bone-50 font-semibold tabular-nums leading-none">
        {value.toLocaleString()}
      </div>
      <p className="text-[11px] text-bone-400 uppercase tracking-wider mt-2 font-medium">
        {label}
      </p>
    </motion.div>
  );
};
