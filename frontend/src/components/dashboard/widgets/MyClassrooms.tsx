import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Users,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Enrollment {
  id: string;
  joinedAt: string;
  classroom: {
    id: string;
    name: string;
    description: string | null;
    subject: string | null;
    teacher: {
      firstName: string | null;
      lastName: string | null;
    };
    _count: { enrollments: number };
  };
}

export const MyClassrooms = () => {
  const qc = useQueryClient();
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ['my-classrooms'],
    queryFn: async () =>
      (await api.get('/teacher/my-classrooms')).data.enrollments,
  });

  const join = useMutation({
    mutationFn: async () =>
      (await api.post('/teacher/classrooms/join', { code: code.trim() })).data
        .enrollment,
    onSuccess: (data: Enrollment) => {
      qc.invalidateQueries({ queryKey: ['my-classrooms'] });
      setSuccess(`Joined "${data.classroom.name}"`);
      setCode('');
      setShowJoin(false);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Invalid code. Check with your teacher.'
      );
      setSuccess(null);
    },
  });

  const leave = useMutation({
    mutationFn: (enrollmentId: string) =>
      api.delete(`/teacher/enrollments/${enrollmentId}`),
    onMutate: async (enrollmentId) => {
      await qc.cancelQueries({ queryKey: ['my-classrooms'] });
      const prev = qc.getQueryData<Enrollment[]>(['my-classrooms']);
      qc.setQueryData<Enrollment[]>(['my-classrooms'], (old = []) =>
        old.filter((e) => e.id !== enrollmentId)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['my-classrooms'], ctx.prev);
    },
  });

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-bone-50 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-violet-400" />
            My Classrooms
          </h3>
          <p className="text-xs text-bone-400 mt-0.5">
            {enrollments.length} enrolled
          </p>
        </div>
        <button
          onClick={() => {
            setShowJoin(!showJoin);
            setError(null);
          }}
          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          {showJoin ? (
            <>
              <X className="w-3 h-3" /> Close
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" /> Join with code
            </>
          )}
        </button>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="text-xs text-emerald-300">{success}</p>
        </motion.div>
      )}

      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="p-3 rounded-lg bg-ink-800 border border-white/[0.06] space-y-2">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Enter 6-character code (e.g. ABC123)"
                autoFocus
                maxLength={20}
                className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm font-mono text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40 tracking-widest text-center"
              />
              {error && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowJoin(false);
                    setCode('');
                    setError(null);
                  }}
                  className="flex-1 py-1.5 rounded-lg border border-white/[0.08] text-bone-300 text-sm hover:bg-white/[0.02] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => join.mutate()}
                  disabled={code.trim().length < 4 || join.isPending}
                  className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {join.isPending ? 'Joining…' : 'Join'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <p className="text-xs text-bone-400 py-4 text-center">Loading…</p>
      )}

      {!isLoading && enrollments.length === 0 && !showJoin && (
        <div className="rounded-lg bg-ink-800/40 p-5 text-center border border-white/[0.04]">
          <Users className="w-7 h-7 text-bone-400/30 mx-auto mb-2" />
          <p className="text-sm text-bone-300">Not enrolled in any classroom</p>
          <p className="text-xs text-bone-400/70 mt-1">
            Ask your teacher for a join code
          </p>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {enrollments.map((e, i) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="group flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-violet-500/[0.04] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-bone-100 truncate">
                  {e.classroom.name}
                </div>
                <div className="text-xs text-bone-400 truncate">
                  {e.classroom.subject && (
                    <>
                      <span className="text-bone-300">
                        {e.classroom.subject}
                      </span>
                      <span className="mx-1.5">·</span>
                    </>
                  )}
                  <span>
                    {e.classroom.teacher.firstName || e.classroom.teacher.lastName
                      ? `${e.classroom.teacher.firstName ?? ''} ${e.classroom.teacher.lastName ?? ''}`.trim()
                      : 'Teacher'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => leave.mutate(e.id)}
                title="Leave classroom"
                className="opacity-0 group-hover:opacity-100 text-bone-400 hover:text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
