import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Pin, Trash2, Plus, Loader2, X } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

export function ClassroomStream({ classroomId, isTeacher }: { classroomId: string; isTeacher: boolean }) {
  const [showCompose, setShowCompose] = useState(false);

  const { data, isLoading } = useQuery<{ announcements: any[] }>({
    queryKey: ['classroom-announcements', classroomId],
    queryFn: async () => (await api.get(`/classroom/${classroomId}/announcements`)).data,
  });

  const announcements = data?.announcements || [];

  return (
    <div className="space-y-3">
      {isTeacher && !showCompose && (
        <button
          onClick={() => setShowCompose(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-dashed border t-border t-bg-elevated hover:border-violet-500/40 hover:bg-violet-500/[0.04] transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium t-text-primary">Post an announcement</p>
            <p className="text-xs t-text-muted">Notify your students about updates, assignments, or class info</p>
          </div>
          <Plus className="w-4 h-4 t-text-muted" />
        </button>
      )}

      <AnimatePresence>
        {showCompose && <ComposeAnnouncement classroomId={classroomId} onClose={() => setShowCompose(false)} />}
      </AnimatePresence>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="anim-shimmer h-32 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && announcements.length === 0 && (
        <div className="t-card p-10 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 t-text-muted opacity-40" />
          <p className="text-sm t-text-muted">No announcements yet.</p>
        </div>
      )}

      <AnimatePresence>
        {announcements.map((a, i) => (
          <AnnouncementCard
            key={a.id}
            classroomId={classroomId}
            announcement={a}
            index={i}
            isTeacher={isTeacher}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ComposeAnnouncement({ classroomId, onClose }: { classroomId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);

  const post = useMutation({
    mutationFn: () => api.post(`/classroom/${classroomId}/announcements`, { title: title.trim(), content: content.trim(), pinned }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom-announcements', classroomId] });
      qc.invalidateQueries({ queryKey: ['classroom', classroomId] });
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="t-card overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold t-text-primary">New announcement</h3>
          <button onClick={onClose} className="p-1 rounded hover:t-bg-elevated">
            <X className="w-4 h-4 t-text-muted" />
          </button>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full px-3 py-2 t-input rounded-lg text-sm focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's the update?"
          rows={4}
          className="w-full px-3 py-2 t-input rounded-lg text-sm resize-none focus:outline-none"
        />
        <label className="flex items-center gap-2 text-xs t-text-secondary cursor-pointer">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-violet-500" />
          <Pin className="w-3 h-3" /> Pin to top
        </label>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg t-border border t-text-secondary text-xs hover:t-border-strong">
            Cancel
          </button>
          <button
            onClick={() => { if (title.trim() && content.trim()) post.mutate(); }}
            disabled={post.isPending || !title.trim() || !content.trim()}
            className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            {post.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AnnouncementCard({ classroomId, announcement: a, index, isTeacher }: { classroomId: string; announcement: any; index: number; isTeacher: boolean }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => api.delete(`/classroom/${classroomId}/announcements/${a.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom-announcements', classroomId] });
      qc.invalidateQueries({ queryKey: ['classroom', classroomId] });
    },
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      className={`t-card p-4 ${a.pinned ? 'border-amber-500/30' : ''}`}
    >
      {a.pinned && (
        <div className="flex items-center gap-1 mb-2 text-[10px] text-amber-500 font-medium uppercase tracking-wider">
          <Pin className="w-3 h-3" /> Pinned
        </div>
      )}
      <div className="flex items-start gap-3">
        <Avatar user={a.author} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold t-text-primary text-sm">{a.title}</h4>
              <p className="text-[11px] t-text-muted">
                {a.author.firstName} {a.author.lastName} · {timeAgo(a.createdAt)}
              </p>
            </div>
            {isTeacher && (
              <button
                onClick={() => { if (confirm('Delete this announcement?')) del.mutate(); }}
                className="p-1.5 rounded hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm t-text-secondary mt-2 whitespace-pre-wrap">{a.content}</p>
        </div>
      </div>
    </motion.div>
  );
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 7 * 86400) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
