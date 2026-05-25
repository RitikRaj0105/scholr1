import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, GraduationCap, Users, FileText, Megaphone, Calendar,
  Archive, LogIn, ChevronRight, Loader2, Sparkles, X,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

interface ClassroomItem {
  id: string;
  name: string;
  code: string;
  subject: string | null;
  description: string | null;
  grade: string | null;
  schedule: string | null;
  bannerColor: string | null;
  archived: boolean;
  teacher?: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  enrollment?: { joinedAt: string };
  _count: { enrollments: number; assignments: number; announcements: number };
}

const BANNER_COLORS = [
  '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#6366f1', '#84cc16', '#14b8a6', '#f97316',
];

export default function ClassroomHub() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery<{ taught: ClassroomItem[]; enrolled: ClassroomItem[] }>({
    queryKey: ['my-classrooms'],
    queryFn: async () => (await api.get('/classroom/my')).data,
  });

  const taught = data?.taught || [];
  const enrolled = data?.enrolled || [];
  const total = taught.length + enrolled.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 flex-wrap"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl t-text-primary">Classrooms</h1>
            <p className="text-xs t-text-muted mt-0.5">
              {total === 0 ? "You're not part of any classroom yet." : `${total} active classroom${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg t-border border t-bg-elevated t-text-secondary text-xs font-medium hover:t-border-strong transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              Join with code
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create classroom
            </button>
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl anim-shimmer h-48" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && total === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="t-card p-10 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="font-display text-xl t-text-primary mb-1">Start your first classroom</h2>
            <p className="text-sm t-text-muted max-w-sm mx-auto">
              Create one as a teacher, or join an existing one using a 6-character code from your teacher.
            </p>
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setShowJoin(true)}
                className="px-4 py-2 rounded-lg t-border border t-text-secondary text-sm hover:t-border-strong transition-all"
              >
                Join with code
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold"
              >
                Create new
              </button>
            </div>
          </motion.div>
        )}

        {/* Teaching */}
        {taught.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold t-text-primary">Teaching</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {taught.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {taught.map((c, i) => (
                <ClassCard key={c.id} cls={c} role="teacher" index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Enrolled */}
        {enrolled.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold t-text-primary">Enrolled as student</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {enrolled.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolled.map((c, i) => (
                <ClassCard key={c.id} cls={c} role="student" index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {showJoin && <JoinModal onClose={() => setShowJoin(false)} />}
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// ─── Class card ──────────────────────────────────────

function ClassCard({ cls, role, index }: { cls: ClassroomItem; role: 'teacher' | 'student'; index: number }) {
  const color = cls.bannerColor || BANNER_COLORS[index % BANNER_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      <Link
        to={`/dashboard/classroom/${cls.id}`}
        className="block t-card overflow-hidden group"
      >
        {/* Banner */}
        <div
          className="h-20 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)` }}
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)',
          }} />
          <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
            <h3 className="font-display text-lg text-white leading-tight drop-shadow-md">{cls.name}</h3>
            {role === 'teacher' && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] text-white font-medium">
                Teacher
              </span>
            )}
          </div>
          <div className="absolute bottom-2 left-4 text-[11px] text-white/90 font-medium">
            {cls.subject && <span>{cls.subject}</span>}
            {cls.grade && <span> · {cls.grade}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {cls.teacher && role === 'student' && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar user={cls.teacher} size={24} />
              <span className="text-xs t-text-muted">
                {cls.teacher.firstName} {cls.teacher.lastName}
              </span>
            </div>
          )}

          {role === 'teacher' && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider t-text-muted mb-1">Join code</p>
              <p className="font-mono text-lg font-bold tracking-wider t-text-primary">{cls.code}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1 text-center pt-3 border-t t-border">
            <Stat icon={Users} value={cls._count.enrollments} label="Students" />
            <Stat icon={FileText} value={cls._count.assignments} label="Work" />
            <Stat icon={Megaphone} value={cls._count.announcements} label="Posts" />
          </div>

          <div className="flex items-center justify-end mt-3 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Open
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 t-text-secondary">
        <Icon className="w-3 h-3" />
        <span className="text-sm font-semibold">{value}</span>
      </div>
      <p className="text-[9px] uppercase tracking-wider t-text-muted mt-0.5">{label}</p>
    </div>
  );
}

// ─── Join modal ──────────────────────────────────────

function JoinModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const join = useMutation({
    mutationFn: () => api.post('/classroom/join', { code: code.trim().toUpperCase() }),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['my-classrooms'] });
      onClose();
      navigate(`/dashboard/classroom/${r.data.classroom.id}`);
    },
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Invalid code'),
  });

  return (
    <Modal onClose={onClose} title="Join a classroom">
      <p className="text-sm t-text-muted mb-4">Enter the 6-character code your teacher gave you.</p>
      <input
        value={code}
        onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
        placeholder="ABC123"
        maxLength={10}
        className="w-full px-4 py-3 t-input rounded-lg text-center text-2xl font-mono tracking-[0.3em] font-bold uppercase focus:outline-none"
      />
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 mt-2 text-center">
          {error}
        </motion.p>
      )}
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg t-border border t-text-secondary text-sm hover:t-border-strong">
          Cancel
        </button>
        <button
          onClick={() => { setError(null); if (code.trim().length >= 4) join.mutate(); }}
          disabled={join.isPending || code.trim().length < 4}
          className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          {join.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Join
        </button>
      </div>
    </Modal>
  );
}

// ─── Create modal ────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    subject: '',
    grade: '',
    description: '',
    schedule: '',
    bannerColor: BANNER_COLORS[0],
  });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => api.post('/classroom', {
      name: form.name.trim(),
      subject: form.subject.trim() || undefined,
      grade: form.grade.trim() || undefined,
      description: form.description.trim() || undefined,
      schedule: form.schedule.trim() || undefined,
      bannerColor: form.bannerColor,
    }),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['my-classrooms'] });
      onClose();
      navigate(`/dashboard/classroom/${r.data.classroom.id}`);
    },
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Could not create'),
  });

  return (
    <Modal onClose={onClose} title="Create a classroom">
      <div className="space-y-3">
        <Field label="Class name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Class 10 Physics" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject" value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v }))} placeholder="Physics" />
          <Field label="Grade / Year" value={form.grade} onChange={(v) => setForm((p) => ({ ...p, grade: v }))} placeholder="Class 10" />
        </div>
        <Field label="Schedule" value={form.schedule} onChange={(v) => setForm((p) => ({ ...p, schedule: v }))} placeholder="Mon, Wed, Fri · 4-5 PM" />

        <div>
          <label className="block text-[10px] uppercase tracking-wider t-text-muted mb-1.5 font-medium">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            placeholder="What's this class about?"
            className="w-full px-3 py-2 t-input rounded-lg text-sm resize-none focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider t-text-muted mb-1.5 font-medium">Theme colour</label>
          <div className="flex gap-2 flex-wrap">
            {BANNER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((p) => ({ ...p, bannerColor: c }))}
                className={`w-8 h-8 rounded-lg transition-all ${form.bannerColor === c ? 'ring-2 ring-offset-2 ring-offset-transparent ring-violet-400 scale-110' : 'hover:scale-105'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg t-border border t-text-secondary text-sm hover:t-border-strong">
          Cancel
        </button>
        <button
          onClick={() => {
            setError(null);
            if (form.name.trim().length < 2) return setError('Name is required');
            create.mutate();
          }}
          disabled={create.isPending}
          className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create
        </button>
      </div>
    </Modal>
  );
}

// ─── Modal wrapper ───────────────────────────────────

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md t-card p-6 border t-border-strong"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl t-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:t-bg-elevated">
            <X className="w-4 h-4 t-text-muted" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider t-text-muted mb-1.5 font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 t-input rounded-lg text-sm focus:outline-none"
      />
    </div>
  );
}
