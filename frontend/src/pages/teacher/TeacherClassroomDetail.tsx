import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Users,
  X,
  Calendar,
  BookOpen,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { api } from '@/lib/api';

interface ClassroomDetail {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  code: string;
  createdAt: string;
  teacherId: string;
  enrollments: {
    id: string;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }[];
  _count: { assignments: number; exams: number };
}

export default function TeacherClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    enrollmentId: string;
    name: string;
  } | null>(null);

  const { data: classroom, isLoading, error } = useQuery<ClassroomDetail>({
    queryKey: ['teacher-classroom', id],
    queryFn: async () =>
      (await api.get(`/teacher/classrooms/${id}`)).data.classroom,
    enabled: !!id,
  });

  const regenerate = useMutation({
    mutationFn: () => api.post(`/teacher/classrooms/${id}/regenerate-code`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-classroom', id] });
      qc.invalidateQueries({ queryKey: ['teacher-classrooms'] });
    },
  });

  const removeStudent = useMutation({
    mutationFn: (enrollmentId: string) =>
      api.delete(`/teacher/students/${enrollmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-classroom', id] });
      qc.invalidateQueries({ queryKey: ['teacher-stats'] });
      setConfirmRemove(null);
    },
  });

  const copyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="p-8 text-bone-400 text-sm">Loading classroom…</div>
      </TeacherLayout>
    );
  }

  if (error || !classroom) {
    return (
      <TeacherLayout>
        <div className="p-8">
          <Link
            to="/teacher/classrooms"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to classrooms
          </Link>
          <div className="mt-6 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">Classroom not found</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-3"
        >
          <Link
            to="/teacher/classrooms"
            className="w-8 h-8 rounded-lg border border-white/[0.06] text-bone-400 hover:text-bone-100 hover:bg-white/[0.03] flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-0.5">
              Teacher · Classroom
            </p>
            <h1 className="font-display text-2xl text-bone-50">
              {classroom.name}
            </h1>
            {classroom.subject && (
              <p className="text-sm text-bone-300 mt-0.5">{classroom.subject}</p>
            )}
          </div>
        </motion.div>

        {/* Top row */}
        <div className="grid grid-cols-12 gap-4 mb-5">
          {/* Join code */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="col-span-12 md:col-span-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5"
          >
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium mb-2">
              Share this join code with students
            </p>
            <div className="flex items-center gap-3">
              <div className="font-mono text-4xl font-bold text-emerald-300 tracking-widest">
                {classroom.code}
              </div>
              <button
                onClick={copyCode}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-900 border border-white/[0.06] hover:border-emerald-500/40 text-bone-200 text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={() => regenerate.mutate()}
                disabled={regenerate.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-900 border border-white/[0.06] hover:border-emerald-500/40 text-bone-200 text-xs font-medium transition-colors disabled:opacity-50"
                title="Generate new code (old one stops working)"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`}
                />
                Reset
              </button>
            </div>
            <p className="text-xs text-bone-400 mt-3 leading-relaxed">
              Students enter this code at <span className="font-mono text-emerald-400">/dashboard/classrooms/join</span> to enroll
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="col-span-12 md:col-span-6 grid grid-cols-3 gap-3"
          >
            <MiniStat
              icon={<Users className="w-4 h-4" />}
              label="Students"
              value={classroom.enrollments.length}
              accent="emerald"
            />
            <MiniStat
              icon={<FileText className="w-4 h-4" />}
              label="Assignments"
              value={classroom._count.assignments}
              accent="violet"
            />
            <MiniStat
              icon={<BookOpen className="w-4 h-4" />}
              label="Exams"
              value={classroom._count.exams}
              accent="cyan"
            />
          </motion.div>
        </div>

        {/* Description if set */}
        {classroom.description && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-4 mb-5"
          >
            <p className="text-sm text-bone-200 leading-relaxed">
              {classroom.description}
            </p>
          </motion.div>
        )}

        {/* Roster */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl border border-white/[0.06] bg-ink-900/60 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-display text-lg text-bone-50">Roster</h3>
            <span className="text-xs text-bone-400 font-mono">
              {classroom.enrollments.length} student
              {classroom.enrollments.length === 1 ? '' : 's'}
            </span>
          </div>

          {classroom.enrollments.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
              <p className="text-bone-300 text-sm mb-1">No students yet</p>
              <p className="text-bone-400 text-xs">
                Share the join code{' '}
                <span className="font-mono text-emerald-400">
                  {classroom.code}
                </span>{' '}
                with your students to get them enrolled
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[10px] uppercase tracking-wider text-bone-400 font-medium bg-white/[0.02]">
                <div className="col-span-7">Student</div>
                <div className="col-span-3">Joined</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
              <AnimatePresence initial={false}>
                {classroom.enrollments.map((e, i) => (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25, delay: i * 0.02 }}
                    className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="col-span-7 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/80 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {(
                          e.user.firstName?.[0] || e.user.email[0]
                        ).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-bone-100 truncate">
                          {e.user.firstName || e.user.lastName
                            ? `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim()
                            : e.user.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-bone-400 truncate">
                          {e.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 text-xs text-bone-400 font-mono">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(e.joinedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit',
                      })}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() =>
                          setConfirmRemove({
                            enrollmentId: e.id,
                            name:
                              e.user.firstName || e.user.email.split('@')[0],
                          })
                        }
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-xs text-bone-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Coming soon */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/40 p-5 opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <h3 className="font-display text-base text-bone-100">
                Assignments
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 uppercase tracking-wider font-medium">
                Coming next
              </span>
            </div>
            <p className="text-xs text-bone-400">
              Assign tests, share notes, and track submissions. Available in Delivery 3.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/40 p-5 opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display text-base text-bone-100">Tests</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 uppercase tracking-wider font-medium">
                Coming next
              </span>
            </div>
            <p className="text-xs text-bone-400">
              Schedule tests for the classroom and review student attempts. Available in Delivery 3.
            </p>
          </div>
        </div>
      </div>

      {/* Remove student modal */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmRemove(null)}
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-red-500/20 bg-ink-900 p-6"
            >
              <h3 className="font-display text-xl text-bone-50 mb-2">
                Remove student?
              </h3>
              <p className="text-sm text-bone-300 mb-4">
                <span className="text-bone-100">{confirmRemove.name}</span> will
                lose access to this classroom. They can rejoin later using the
                join code.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="flex-1 py-2 rounded-lg border border-white/[0.08] text-bone-300 text-sm hover:bg-white/[0.02] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeStudent.mutate(confirmRemove.enrollmentId)}
                  disabled={removeStudent.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {removeStudent.isPending ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TeacherLayout>
  );
}

const MiniStat = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'emerald' | 'violet' | 'cyan';
}) => {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
  };
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4">
      <div
        className={`w-7 h-7 rounded-md border flex items-center justify-center mb-2 ${colors[accent]}`}
      >
        {icon}
      </div>
      <div className="font-mono text-xl text-bone-50 font-semibold tabular-nums leading-none">
        {value.toLocaleString()}
      </div>
      <p className="text-[10px] text-bone-400 uppercase tracking-wider mt-1.5 font-medium">
        {label}
      </p>
    </div>
  );
};
