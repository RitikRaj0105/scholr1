import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RefreshCw, Archive, Trash2, Save, Loader2, Video, Check } from 'lucide-react';
import { api } from '@/lib/api';

const BANNER_COLORS = [
  '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#6366f1', '#84cc16', '#14b8a6', '#f97316',
];

export function ClassroomSettings({ classroom }: { classroom: any }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: classroom.name,
    subject: classroom.subject || '',
    grade: classroom.grade || '',
    schedule: classroom.schedule || '',
    description: classroom.description || '',
    meetingLink: classroom.meetingLink || '',
    bannerColor: classroom.bannerColor || BANNER_COLORS[0],
  });
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => api.patch(`/classroom/${classroom.id}`, {
      name: form.name.trim(),
      subject: form.subject.trim() || undefined,
      grade: form.grade.trim() || undefined,
      schedule: form.schedule.trim() || undefined,
      description: form.description.trim() || undefined,
      meetingLink: form.meetingLink.trim() || '',
      bannerColor: form.bannerColor,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom', classroom.id] });
      qc.invalidateQueries({ queryKey: ['my-classrooms'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    },
  });

  const regen = useMutation({
    mutationFn: () => api.post(`/classroom/${classroom.id}/regenerate-code`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classroom', classroom.id] }),
  });

  const archive = useMutation({
    mutationFn: () => api.post(`/classroom/${classroom.id}/archive`, { archived: !classroom.archived }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-classrooms'] });
      qc.invalidateQueries({ queryKey: ['classroom', classroom.id] });
    },
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/classroom/${classroom.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-classrooms'] });
      navigate('/dashboard/classroom');
    },
  });

  return (
    <div className="space-y-4">
      {/* Basics */}
      <div className="t-card p-5">
        <h3 className="font-semibold t-text-primary mb-4">Classroom details</h3>

        <div className="space-y-3">
          <Input label="Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Subject" value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v }))} />
            <Input label="Grade / Year" value={form.grade} onChange={(v) => setForm((p) => ({ ...p, grade: v }))} />
          </div>
          <Input label="Schedule" value={form.schedule} onChange={(v) => setForm((p) => ({ ...p, schedule: v }))} placeholder="Mon, Wed, Fri · 4-5 PM" />
          <Input label="Meeting link" value={form.meetingLink} onChange={(v) => setForm((p) => ({ ...p, meetingLink: v }))} placeholder="https://zoom.us/..." />
          <div>
            <label className="block text-[10px] uppercase tracking-wider t-text-muted mb-1.5 font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
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

          <div className="flex justify-end pt-2">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {saved ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Saved
                </motion.span>
              ) : save.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving</>
              ) : (
                <><Save className="w-4 h-4" /> Save changes</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Join code */}
      <div className="t-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold t-text-primary">Join code</h3>
            <p className="text-xs t-text-muted mt-0.5">Reset if you want to stop new students from joining.</p>
          </div>
          <button
            onClick={() => { if (confirm('Generate a new code? Old code will stop working.')) regen.mutate(); }}
            disabled={regen.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg t-border border t-text-secondary text-xs hover:t-border-strong"
          >
            {regen.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate
          </button>
        </div>
      </div>

      {/* Archive / Delete */}
      <div className="t-card p-5 border-red-500/20">
        <h3 className="font-semibold text-red-400 mb-1">Danger zone</h3>
        <p className="text-xs t-text-muted mb-4">These actions can't easily be undone.</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium t-text-primary">
                {classroom.archived ? 'Unarchive classroom' : 'Archive classroom'}
              </p>
              <p className="text-[11px] t-text-muted">
                {classroom.archived ? 'Restore visibility for everyone.' : 'Hides from the main list but keeps data.'}
              </p>
            </div>
            <button
              onClick={() => archive.mutate()}
              disabled={archive.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs hover:bg-amber-500/10"
            >
              <Archive className="w-3.5 h-3.5" />
              {classroom.archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t t-border">
            <div>
              <p className="text-sm font-medium text-red-400">Delete classroom</p>
              <p className="text-[11px] t-text-muted">Permanently deletes everything: students, materials, attendance.</p>
            </div>
            <button
              onClick={() => { if (confirm(`Delete "${classroom.name}"? This cannot be undone.`)) del.mutate(); }}
              disabled={del.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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
