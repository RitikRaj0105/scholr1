import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  GraduationCap,
  Copy,
  Check,
  Users,
  Trash2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { api } from '@/lib/api';

interface ClassroomRow {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  code: string;
  createdAt: string;
  _count: { enrollments: number; assignments: number; exams: number };
}

export default function TeacherClassrooms() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClassroomRow | null>(null);

  const { data: classrooms = [], isLoading } = useQuery<ClassroomRow[]>({
    queryKey: ['teacher-classrooms'],
    queryFn: async () => (await api.get('/teacher/classrooms')).data.classrooms,
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/classrooms/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-classrooms'] });
      qc.invalidateQueries({ queryKey: ['teacher-stats'] });
      setConfirmDelete(null);
    },
  });

  const regenerate = useMutation({
    mutationFn: (id: string) =>
      api.post(`/teacher/classrooms/${id}/regenerate-code`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-classrooms'] });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const filtered = classrooms.filter((c) =>
    search
      ? c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(search.toLowerCase())
      : true
  );

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
              Classrooms
              <span className="text-bone-400 text-xl ml-2 font-mono">
                {classrooms.length}
              </span>
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

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or subject…"
            className="w-full pl-10 pr-4 py-2 bg-ink-900/60 border border-white/[0.06] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-emerald-500/40"
          />
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-12 text-center text-bone-400 text-sm">
            Loading classrooms…
          </div>
        )}

        {!isLoading && classrooms.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-12 text-center">
            <GraduationCap className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
            <p className="text-bone-300 text-sm mb-1">No classrooms yet</p>
            <p className="text-bone-400 text-xs mb-4">
              Create your first classroom — students can then join with the code you share
            </p>
            <Link
              to="/teacher/classrooms/new"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create first classroom
            </Link>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5 hover:border-emerald-500/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <button
                      onClick={() => setConfirmDelete(c)}
                      className="opacity-0 group-hover:opacity-100 text-bone-400 hover:text-red-400 transition-all"
                      title="Delete classroom"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link to={`/teacher/classrooms/${c.id}`}>
                    <h3 className="font-display text-lg text-bone-50 mb-1 leading-tight">
                      {c.name}
                    </h3>
                  </Link>
                  {c.subject && (
                    <p className="text-xs text-bone-300 mb-2">{c.subject}</p>
                  )}
                  {c.description && (
                    <p className="text-xs text-bone-400 line-clamp-2 mb-3">
                      {c.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mb-4 text-xs text-bone-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {c._count.enrollments}
                    </span>
                    <span className="opacity-30">·</span>
                    <span>Created {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {/* Join code */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-ink-950 border border-white/[0.08] flex items-center justify-between">
                      <span className="text-[10px] text-bone-400 uppercase tracking-wider">
                        Join code
                      </span>
                      <span className="font-mono text-sm text-emerald-400 tracking-widest font-semibold">
                        {c.code}
                      </span>
                    </div>
                    <button
                      onClick={() => copyCode(c.code)}
                      title="Copy code"
                      className="w-9 h-9 rounded-lg border border-white/[0.08] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors flex items-center justify-center"
                    >
                      {copiedCode === c.code ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-bone-400" />
                      )}
                    </button>
                    <button
                      onClick={() => regenerate.mutate(c.id)}
                      title="Regenerate code"
                      className="w-9 h-9 rounded-lg border border-white/[0.08] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors flex items-center justify-center"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-bone-400 ${regenerate.isPending ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>

                  <Link
                    to={`/teacher/classrooms/${c.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 text-xs font-medium transition-colors border border-emerald-500/15"
                  >
                    Open classroom <ArrowRight className="w-3 h-3" />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
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
                Delete classroom?
              </h3>
              <p className="text-sm text-bone-300 mb-4">
                <span className="text-bone-100">{confirmDelete.name}</span> and all{' '}
                <span className="text-red-400">
                  {confirmDelete._count.enrollments} student enrollments
                </span>{' '}
                will be permanently removed. Students will lose access immediately.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 rounded-lg border border-white/[0.08] text-bone-300 text-sm hover:bg-white/[0.02] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => del.mutate(confirmDelete.id)}
                  disabled={del.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {del.isPending ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TeacherLayout>
  );
}
