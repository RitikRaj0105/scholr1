import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, AlertCircle, Save } from 'lucide-react';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { api } from '@/lib/api';

export default function TeacherNewClassroom() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/teacher/classrooms', {
          name,
          subject: subject || undefined,
          description: description || undefined,
        })
      ).data.classroom,
    onSuccess: (classroom) => {
      navigate(`/teacher/classrooms/${classroom.id}`);
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.error?.message || err?.message || 'Failed to create'
      );
    },
  });

  return (
    <TeacherLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
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
              Teacher · New Classroom
            </p>
            <h1 className="font-display text-2xl text-bone-50">
              Create a classroom
            </h1>
          </div>
        </motion.div>

        {error && (
          <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm text-bone-300">
              Set up a new classroom. A unique 6-character join code will be generated automatically.
            </p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1.5 font-medium">
              Classroom name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 12 Physics — Section A"
              autoFocus
              maxLength={120}
              className="w-full px-3 py-2.5 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1.5 font-medium">
              Subject (optional)
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Physics, Math, Chemistry…"
              maxLength={60}
              className="w-full px-3 py-2.5 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1.5 font-medium">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this classroom about? What students should expect…"
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2.5 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-emerald-500/40 transition-colors resize-y"
            />
            <p className="text-[10px] text-bone-400 mt-1 font-mono">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
            <Link
              to="/teacher/classrooms"
              className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-bone-300 text-sm font-medium hover:bg-white/[0.02] transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              onClick={() => create.mutate()}
              disabled={!name.trim() || create.isPending}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-ink-700 disabled:text-bone-400 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {create.isPending ? 'Creating…' : 'Create classroom'}
            </button>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
