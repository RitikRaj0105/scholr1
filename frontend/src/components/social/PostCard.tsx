import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Award, Trophy,
  Sparkles, Globe, Users, Lock, Send, X, Flag, AlertCircle, ShieldX, Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore, isAdmin } from '@/store/authStore';
import { Avatar } from './Avatar';

export interface SocialUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  headline: string | null;
}

export interface PostData {
  id: string;
  userId: string;
  user: SocialUser;
  type: 'POST' | 'ACHIEVEMENT' | 'CERTIFICATE' | 'MILESTONE';
  content: string;
  imageUrl?: string | null;
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  achievement?: { title: string; subject?: string; score?: string; date?: string } | null;
  certificate?: { title: string; issuer: string; credentialUrl?: string } | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  isLikedByMe: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: SocialUser;
}

const VIS_CONFIG = {
  PUBLIC: { icon: Globe, label: 'Public' },
  FOLLOWERS_ONLY: { icon: Users, label: 'Followers' },
  PRIVATE: { icon: Lock, label: 'Only you' },
};

const ROLE_COLOR: Record<string, string> = {
  STUDENT: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  TEACHER: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  SUPER_ADMIN: 'text-red-400 bg-red-500/10 border-red-500/20',
  SCHOOL_ADMIN: 'text-red-400 bg-red-500/10 border-red-500/20',
  COLLEGE_ADMIN: 'text-red-400 bg-red-500/10 border-red-500/20',
  RECRUITER: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'HATE_SPEECH', label: 'Hate speech' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'MISINFORMATION', label: 'False information' },
  { value: 'COPYRIGHT', label: 'Copyright violation' },
  { value: 'OTHER', label: 'Something else' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fullName(u: SocialUser): string {
  if (u.firstName || u.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return u.email.split('@')[0];
}

interface Props {
  post: PostData;
  onDelete?: () => void;
}

export const PostCard = ({ post, onDelete }: Props) => {
  const me = useAuthStore((s) => s.user);
  const meIsAdmin = isAdmin(me);
  const qc = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('SPAM');
  const [reportDetails, setReportDetails] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [optimisticLike, setOptimisticLike] = useState({
    liked: post.isLikedByMe, count: post.likeCount,
  });

  const isMine = me?.id === post.userId;
  const VisIcon = VIS_CONFIG[post.visibility].icon;

  const likeMut = useMutation({
    mutationFn: () => api.post(`/social/posts/${post.id}/like`),
    onMutate: () => {
      setOptimisticLike((s) => ({ liked: !s.liked, count: s.count + (s.liked ? -1 : 1) }));
    },
    onError: () => setOptimisticLike({ liked: post.isLikedByMe, count: post.likeCount }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const shareMut = useMutation({
    mutationFn: () => api.post(`/social/posts/${post.id}/share`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/social/posts/${post.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      onDelete?.();
    },
  });

  const adminDeleteMut = useMutation({
    mutationFn: () => api.delete(`/admin/posts/${post.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      onDelete?.();
    },
  });

  const reportMut = useMutation({
    mutationFn: () => api.post(`/social/posts/${post.id}/report`, {
      reason: reportReason,
      ...(reportDetails ? { details: reportDetails } : {}),
    }),
    onSuccess: () => {
      setReportSuccess(true);
      setReportError(null);
      setTimeout(() => { setReportOpen(false); setReportSuccess(false); setReportDetails(''); }, 1500);
    },
    onError: (err: any) => setReportError(
      err?.response?.data?.error?.message || err?.message || 'Could not report'
    ),
  });

  const commentsQuery = useQuery<Comment[]>({
    queryKey: ['post-comments', post.id],
    queryFn: async () => (await api.get(`/social/posts/${post.id}/comments`)).data.comments,
    enabled: showComments,
  });

  const addCommentMut = useMutation({
    mutationFn: () => api.post(`/social/posts/${post.id}/comments`, { content: newComment.trim() }),
    onSuccess: () => {
      setNewComment('');
      qc.invalidateQueries({ queryKey: ['post-comments', post.id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) => api.delete(`/social/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments', post.id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/feed?post=${post.id}`);
    shareMut.mutate();
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/[0.06] bg-ink-900/60 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Link to={`/dashboard/profile/${post.userId}`}>
          <Avatar user={post.user} size={40} ring />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/dashboard/profile/${post.userId}`} className="text-sm font-medium text-bone-50 hover:text-violet-300 truncate">
              {fullName(post.user)}
            </Link>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium ${
              ROLE_COLOR[post.user.role] || ROLE_COLOR.STUDENT
            }`}>
              {post.user.role.replace('_', ' ')}
            </span>
          </div>
          {post.user.headline && (<p className="text-xs text-bone-400 truncate">{post.user.headline}</p>)}
          <div className="flex items-center gap-1.5 text-[11px] text-bone-400 mt-0.5">
            <span>{timeAgo(post.createdAt)}</span>
            <span className="opacity-50">·</span>
            <VisIcon className="w-2.5 h-2.5" />
            <span>{VIS_CONFIG[post.visibility].label}</span>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-md text-bone-400 hover:text-bone-100 hover:bg-white/[0.04] flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-9 z-10 w-44 rounded-lg border border-white/[0.08] bg-ink-900 shadow-xl py-1">
                {!isMine && (
                  <button onClick={() => { setShowMenu(false); setReportOpen(true); }} className="w-full px-3 py-2 text-left text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-2">
                    <Flag className="w-3 h-3" /> Report post
                  </button>
                )}
                {isMine && (
                  <button onClick={() => { setShowMenu(false); if (confirm('Delete this post?')) deleteMut.mutate(); }} className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                    <Trash2 className="w-3 h-3" /> Delete post
                  </button>
                )}
                {meIsAdmin && !isMine && (
                  <button onClick={() => { setShowMenu(false); if (confirm('Delete this post as admin?')) adminDeleteMut.mutate(); }} className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/[0.04]">
                    <ShieldX className="w-3 h-3" /> Admin delete
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-sm text-bone-100 whitespace-pre-wrap leading-relaxed">{post.content}</p>

        {post.imageUrl && (
          <img src={post.imageUrl} alt="" className="mt-3 rounded-lg max-h-[500px] w-full object-cover border border-white/[0.04]" />
        )}

        {post.type === 'ACHIEVEMENT' && post.achievement && (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base text-bone-50">{post.achievement.title}</p>
              <p className="text-xs text-bone-300 mt-0.5">
                {post.achievement.subject && <span>{post.achievement.subject}</span>}
                {post.achievement.subject && post.achievement.score && <span className="mx-1.5 opacity-50">·</span>}
                {post.achievement.score && <span className="text-amber-400 font-medium">{post.achievement.score}</span>}
              </p>
            </div>
          </div>
        )}

        {post.type === 'CERTIFICATE' && post.certificate && (
          <div className="mt-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base text-bone-50">{post.certificate.title}</p>
              <p className="text-xs text-bone-300 mt-0.5">Issued by <span className="text-violet-300">{post.certificate.issuer}</span></p>
            </div>
            {post.certificate.credentialUrl && (
              <a href={post.certificate.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300">Verify</a>
            )}
          </div>
        )}

        {post.type === 'MILESTONE' && (
          <div className="mt-3 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-transparent p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="min-w-0"><p className="font-display text-base text-bone-50">Milestone reached!</p></div>
          </div>
        )}
      </div>

      {/* Engagement counts */}
      <div className="px-4 pb-2 flex items-center gap-4 text-[11px] text-bone-400">
        {optimisticLike.count > 0 && (<span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400 fill-red-400" />{optimisticLike.count}</span>)}
        {post.commentCount > 0 && (<button onClick={() => setShowComments(true)} className="hover:text-bone-200">{post.commentCount} comment{post.commentCount === 1 ? '' : 's'}</button>)}
        {post.shareCount > 0 && (<span>{post.shareCount} share{post.shareCount === 1 ? '' : 's'}</span>)}
      </div>

      {/* Action bar */}
      <div className="border-t border-white/[0.04] flex">
        <button onClick={() => likeMut.mutate()} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors ${optimisticLike.liked ? 'text-red-400 bg-red-500/[0.04] hover:bg-red-500/[0.08]' : 'text-bone-300 hover:bg-white/[0.03]'}`}>
          <Heart className={`w-4 h-4 ${optimisticLike.liked ? 'fill-red-400' : ''}`} /> Like
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-bone-300 hover:bg-white/[0.03]">
          <MessageCircle className="w-4 h-4" /> Comment
        </button>
        <button onClick={copyShareLink} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-bone-300 hover:bg-white/[0.03]">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[0.04]">
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Avatar user={me} size={32} />
                <div className="flex-1 flex gap-2">
                  <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newComment.trim()) { e.preventDefault(); addCommentMut.mutate(); } }} placeholder="Write a comment…" className="flex-1 px-3 py-1.5 bg-ink-800 border border-white/[0.08] rounded-full text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40" />
                  <button onClick={() => addCommentMut.mutate()} disabled={!newComment.trim() || addCommentMut.isPending} className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 disabled:bg-ink-700 disabled:text-bone-400 text-white flex items-center justify-center disabled:cursor-not-allowed">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {commentsQuery.isLoading && (<p className="text-xs text-bone-400 text-center py-2">Loading…</p>)}
              {(commentsQuery.data ?? []).map((c) => {
                const canDelete = me?.id === c.userId || isMine || meIsAdmin;
                return (
                  <div key={c.id} className="flex items-start gap-2 group">
                    <Link to={`/dashboard/profile/${c.userId}`}><Avatar user={c.user} size={32} /></Link>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl bg-ink-800 px-3 py-2">
                        <Link to={`/dashboard/profile/${c.userId}`} className="text-xs font-medium text-bone-50 hover:text-violet-300">{fullName(c.user)}</Link>
                        <p className="text-xs text-bone-200 whitespace-pre-wrap mt-0.5">{c.content}</p>
                      </div>
                      <p className="text-[10px] text-bone-400 mt-1 ml-3">{timeAgo(c.createdAt)}</p>
                    </div>
                    {canDelete && (
                      <button onClick={() => deleteCommentMut.mutate(c.id)} className="opacity-0 group-hover:opacity-100 text-bone-400 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report modal */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReportOpen(false)} className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-ink-900 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-5 h-5 text-amber-400" />
                <h3 className="font-display text-xl text-bone-50">Report post</h3>
              </div>
              <p className="text-sm text-bone-300 mb-4">Help us keep Scholr safe. A moderator will review this post.</p>

              {reportSuccess ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-emerald-300">Report submitted. Thanks!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 mb-4">
                    {REPORT_REASONS.map((r) => (
                      <label key={r.value} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.02] cursor-pointer">
                        <input type="radio" name="reason" value={r.value} checked={reportReason === r.value} onChange={(e) => setReportReason(e.target.value)} className="accent-amber-500" />
                        <span className="text-sm text-bone-200">{r.label}</span>
                      </label>
                    ))}
                  </div>
                  <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Details (optional)" maxLength={1000} rows={3} className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-amber-500/40 resize-y mb-3" />
                  {reportError && (
                    <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5" />
                      <p className="text-xs text-red-300">{reportError}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setReportOpen(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-bone-300 text-sm hover:bg-white/[0.02]">Cancel</button>
                    <button onClick={() => reportMut.mutate()} disabled={reportMut.isPending} className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
                      {reportMut.isPending ? 'Submitting…' : 'Submit report'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};
