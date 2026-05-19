import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  AlertTriangle,
  Plus,
  X,
  CalendarPlus,
} from 'lucide-react';
import { api } from '@/lib/api';

interface PersonalExam {
  id: string;
  title: string;
  subject: string | null;
  examDate: string;
  notes: string | null;
  daysLeft: number;
}

const SUBJECT_GRADIENT = (s: string | null) => {
  if (!s) return 'from-slate-400 to-slate-500';
  const map: Record<string, string> = {
    physics: 'from-indigo-400 to-violet-500',
    chemistry: 'from-rose-400 to-pink-500',
    math: 'from-cyan-400 to-blue-500',
    mathematics: 'from-cyan-400 to-blue-500',
    biology: 'from-emerald-400 to-teal-500',
    english: 'from-orange-400 to-amber-500',
    history: 'from-amber-400 to-orange-500',
  };
  return map[s.toLowerCase()] || 'from-slate-400 to-slate-500';
};

export const MyExams = () => {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    examDate: '',
  });

  const { data: exams = [], isLoading } = useQuery<PersonalExam[]>({
    queryKey: ['my-exams'],
    queryFn: async () => (await api.get('/planner/my-exams')).data.exams,
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/planner/my-exams', {
          title: form.title,
          subject: form.subject || undefined,
          examDate: form.examDate,
        })
      ).data.exam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-exams'] });
      setAdding(false);
      setForm({ title: '', subject: '', examDate: '' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/planner/my-exams/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['my-exams'] });
      const prev = qc.getQueryData<PersonalExam[]>(['my-exams']);
      qc.setQueryData<PersonalExam[]>(['my-exams'], (old = []) =>
        old.filter((e) => e.id !== id)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['my-exams'], ctx.prev);
    },
  });

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600" />
            My Exams
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {exams.length} upcoming
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          {adding ? (
            <>
              <X size={14} /> Close
            </>
          ) : (
            <>
              <Plus size={14} /> Add
            </>
          )}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-3"
          >
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. JEE Main, Physics midterm…"
                autoFocus
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder="Subject (optional)"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <input
                  type="date"
                  min={tomorrow}
                  value={form.examDate}
                  onChange={(e) =>
                    setForm({ ...form, examDate: e.target.value })
                  }
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => create.mutate()}
                  disabled={
                    !form.title.trim() || !form.examDate || create.isPending
                  }
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-soft"
                >
                  {create.isPending ? 'Adding…' : 'Add exam'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading && (
        <div className="text-sm text-slate-400 py-4 text-center">Loading…</div>
      )}

      {!isLoading && exams.length === 0 && !adding && (
        <div className="rounded-xl bg-slate-50 p-6 text-center">
          <CalendarPlus size={28} className="text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-medium text-slate-600">
            No exams added yet
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Click <span className="text-indigo-600">+ Add</span> to track your
            first exam
          </div>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {exams.map((exam, i) => {
            const urgent = exam.daysLeft <= 7;
            const warning = exam.daysLeft <= 20 && !urgent;
            return (
              <motion.div
                key={exam.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${SUBJECT_GRADIENT(exam.subject)} flex-shrink-0`}
                    />
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {exam.title}
                    </span>
                    {exam.subject && (
                      <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200 flex-shrink-0">
                        {exam.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`flex items-center gap-1 ${
                        urgent
                          ? 'text-rose-600'
                          : warning
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {urgent && <AlertTriangle size={12} />}
                      <span className="text-xs font-bold tabular-nums">
                        {exam.daysLeft}d
                      </span>
                    </div>
                    <button
                      onClick={() => remove.mutate(exam.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(exam.examDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
