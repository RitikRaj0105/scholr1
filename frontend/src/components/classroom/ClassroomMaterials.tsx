import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Video, Link as LinkIcon, Image, File, Plus, ExternalLink, Trash2, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';

const TYPE_ICONS: Record<string, any> = {
  PDF: FileText, VIDEO: Video, LINK: LinkIcon, IMAGE: Image, DOC: FileText, OTHER: File,
};

const TYPE_COLORS: Record<string, string> = {
  PDF: 'text-red-400 bg-red-500/10 border-red-500/20',
  VIDEO: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  LINK: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  IMAGE: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  DOC: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  OTHER: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

export function ClassroomMaterials({ classroomId, isTeacher }: { classroomId: string; isTeacher: boolean }) {
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery<{ materials: any[] }>({
    queryKey: ['classroom-materials', classroomId],
    queryFn: async () => (await api.get(`/classroom/${classroomId}/materials`)).data,
  });

  const materials = data?.materials || [];

  return (
    <div className="space-y-3">
      {isTeacher && (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-dashed border t-border t-bg-elevated hover:border-violet-500/40 hover:bg-violet-500/[0.04] transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Plus className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium t-text-primary">Add a material</p>
            <p className="text-xs t-text-muted">Share notes, videos, or links with your class</p>
          </div>
        </button>
      )}

      <AnimatePresence>
        {showAdd && <AddMaterial classroomId={classroomId} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      {isLoading && (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="anim-shimmer h-20 rounded-xl" />)}</div>
      )}

      {!isLoading && materials.length === 0 && (
        <div className="t-card p-10 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 t-text-muted opacity-40" />
          <p className="text-sm t-text-muted">No materials shared yet.</p>
        </div>
      )}

      <AnimatePresence>
        {materials.map((m, i) => (
          <MaterialCard key={m.id} classroomId={classroomId} material={m} index={i} isTeacher={isTeacher} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function MaterialCard({ classroomId, material: m, index, isTeacher }: { classroomId: string; material: any; index: number; isTeacher: boolean }) {
  const qc = useQueryClient();
  const Icon = TYPE_ICONS[m.type] || File;
  const colorClass = TYPE_COLORS[m.type] || TYPE_COLORS.OTHER;
  const url = m.linkUrl || m.fileUrl;

  const del = useMutation({
    mutationFn: () => api.delete(`/classroom/${classroomId}/materials/${m.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classroom-materials', classroomId] }),
  });

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: Math.min(index * 0.03, 0.25) }}
      className="t-card p-3 flex items-center gap-3 group hover:scale-[1.01] transition-transform"
    >
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium t-text-primary truncate">{m.title}</p>
        {m.description && <p className="text-xs t-text-muted truncate mt-0.5">{m.description}</p>}
        <p className="text-[10px] t-text-muted mt-1">
          {m.author.firstName} {m.author.lastName} · {new Date(m.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <ExternalLink className="w-3.5 h-3.5 t-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        {isTeacher && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm('Delete this material?')) del.mutate();
            }}
            className="p-1.5 rounded hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.a>
  );
}

function AddMaterial({ classroomId, onClose }: { classroomId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    linkUrl: '',
    type: 'LINK' as 'PDF' | 'VIDEO' | 'LINK' | 'IMAGE' | 'DOC' | 'OTHER',
  });

  const add = useMutation({
    mutationFn: () => api.post(`/classroom/${classroomId}/materials`, {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      linkUrl: form.linkUrl.trim(),
      type: form.type,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom-materials', classroomId] });
      qc.invalidateQueries({ queryKey: ['classroom', classroomId] });
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="t-card overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold t-text-primary">New material</h3>
          <button onClick={onClose} className="p-1 rounded hover:t-bg-elevated">
            <X className="w-4 h-4 t-text-muted" />
          </button>
        </div>

        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Title (e.g. Chapter 3 Notes)"
          className="w-full px-3 py-2 t-input rounded-lg text-sm focus:outline-none"
        />
        <input
          value={form.linkUrl}
          onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
          placeholder="URL (YouTube link, Drive link, etc.)"
          type="url"
          className="w-full px-3 py-2 t-input rounded-lg text-sm focus:outline-none"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 t-input rounded-lg text-sm resize-none focus:outline-none"
        />

        <div>
          <label className="block text-[10px] uppercase tracking-wider t-text-muted mb-1.5 font-medium">Type</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(TYPE_ICONS) as Array<keyof typeof TYPE_ICONS>).map((t) => {
              const Icon = TYPE_ICONS[t];
              const active = form.type === t;
              return (
                <button
                  key={t}
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                    active ? `${TYPE_COLORS[t]} border-current` : 't-border border t-text-secondary hover:t-border-strong'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg t-border border t-text-secondary text-xs hover:t-border-strong">
            Cancel
          </button>
          <button
            onClick={() => { if (form.title.trim() && form.linkUrl.trim()) add.mutate(); }}
            disabled={add.isPending || !form.title.trim() || !form.linkUrl.trim()}
            className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            {add.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
