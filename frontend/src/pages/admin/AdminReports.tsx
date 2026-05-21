import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag,
  CheckCircle2,
  XCircle,
  ShieldX,
  AlertCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: 'PENDING' | 'REVIEWED_KEPT' | 'REVIEWED_REMOVED' | 'DISMISSED';
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reporter: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  post: {
    id: string;
    content: string;
    imageUrl: string | null;
    type: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  } | null;
  reviewer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

const REASON_LABEL: Record<string, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  HATE_SPEECH: 'Hate speech',
  INAPPROPRIATE: 'Inappropriate',
  MISINFORMATION: 'Misinformation',
  COPYRIGHT: 'Copyright',
  OTHER: 'Other',
};

const REASON_COLOR: Record<string, string> = {
  SPAM: 'text-bone-300 bg-bone-500/10 border-bone-500/20',
  HARASSMENT: 'text-red-300 bg-red-500/10 border-red-500/20',
  HATE_SPEECH: 'text-red-300 bg-red-500/10 border-red-500/20',
  INAPPROPRIATE: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  MISINFORMATION: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  COPYRIGHT: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  OTHER: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  REVIEWED_KEPT: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  REVIEWED_REMOVED: 'text-red-400 bg-red-500/10 border-red-500/20',
  DISMISSED: 'text-bone-400 bg-bone-500/10 border-bone-500/20',
};

function fullName(u: { firstName: string | null; lastName: string | null; email: string }): string {
  if (u.firstName || u.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return u.email.split('@')[0];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminReports() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      return (await api.get(`/admin/reports?${params.toString()}`)).data.reports;
    },
  });

  const review = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'REMOVE_POST' | 'KEEP_POST' | 'DISMISS' }) =>
      api.post(`/admin/reports/${id}/review`, {
        action,
        ...(reviewNote ? { note: reviewNote } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      setActiveReport(null);
      setReviewNote('');
    },
  });

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
        >
          <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">
            Moderation
          </p>
          <h1 className="font-display text-3xl text-bone-50">
            Reported posts
            {statusFilter === 'PENDING' && pendingCount > 0 && (
              <span className="text-amber-400 text-xl ml-2 font-mono">
                {pendingCount} pending
              </span>
            )}
          </h1>
        </motion.div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-1 flex-wrap">
          {['PENDING', 'REVIEWED_REMOVED', 'REVIEWED_KEPT', 'DISMISSED', 'ALL'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                  : 'border border-white/[0.06] text-bone-300 hover:bg-white/[0.03]'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('REVIEWED_', '').replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-10 text-center text-bone-400 text-sm">
            Loading reports…
          </div>
        )}

        {!isLoading && reports.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-10 text-center">
            <Flag className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
            <p className="text-sm text-bone-300 mb-1">No reports here</p>
            <p className="text-xs text-bone-400">
              {statusFilter === 'PENDING' ? 'No pending reports — moderation queue is clear' : 'No reports match this filter'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {reports.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar user={r.reporter} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-bone-100 font-medium">
                        {fullName(r.reporter)}
                      </span>
                      <span className="text-xs text-bone-400">reported a post</span>
                      <span className="text-[10px] text-bone-400">·</span>
                      <span className="text-[10px] text-bone-400">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-medium ${REASON_COLOR[r.reason]}`}>
                        {REASON_LABEL[r.reason]}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-medium ${STATUS_COLOR[r.status]}`}>
                        {r.status.replace('REVIEWED_', '').replace('_', ' ')}
                      </span>
                    </div>
                    {r.details && (
                      <p className="text-xs text-bone-300 mt-2 px-3 py-2 rounded-lg bg-white/[0.02]">
                        "{r.details}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Reported post */}
                {r.post ? (
                  <div className="mt-3 ml-11 rounded-lg border border-white/[0.06] bg-ink-950 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar user={r.post.user} size={24} />
                      <span className="text-xs text-bone-200">{fullName(r.post.user)}</span>
                      <Link
                        to={`/dashboard/profile/${r.post.user.id}`}
                        target="_blank"
                        className="text-bone-400 hover:text-violet-400"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-sm text-bone-100 whitespace-pre-wrap line-clamp-4">{r.post.content}</p>
                    {r.post.imageUrl && (
                      <img src={r.post.imageUrl} alt="" className="mt-2 rounded max-h-40" />
                    )}
                  </div>
                ) : (
                  <p className="mt-3 ml-11 text-xs text-bone-400 italic">Post deleted</p>
                )}

                {/* Already reviewed */}
                {r.status !== 'PENDING' && r.reviewer && (
                  <p className="mt-3 ml-11 text-xs text-bone-400">
                    Reviewed by {fullName(r.reviewer as any)}{' '}
                    {r.reviewedAt && timeAgo(r.reviewedAt)}
                    {r.reviewNote && <span className="block mt-1 italic">"{r.reviewNote}"</span>}
                  </p>
                )}

                {/* Actions */}
                {r.status === 'PENDING' && (
                  <div className="mt-3 ml-11 flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        if (confirm('Delete this post permanently?')) {
                          review.mutate({ id: r.id, action: 'REMOVE_POST' });
                        }
                      }}
                      disabled={review.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove post
                    </button>
                    <button
                      onClick={() => review.mutate({ id: r.id, action: 'KEEP_POST' })}
                      disabled={review.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Keep
                    </button>
                    <button
                      onClick={() => review.mutate({ id: r.id, action: 'DISMISS' })}
                      disabled={review.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-bone-400 hover:bg-white/[0.03] text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      Dismiss
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
