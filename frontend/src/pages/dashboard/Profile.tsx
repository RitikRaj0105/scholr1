import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Users,
  Award,
  FileText,
  Calendar,
  Edit3,
  Ban,
  CheckCircle2,
  Camera,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PostCard, type PostData, type SocialUser } from '@/components/social/PostCard';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface ProfileData extends SocialUser {
  bio: string | null;
  createdAt: string;
  isFollowedByMe: boolean;
  isMe: boolean;
  _count: {
    followers: number;
    following: number;
    posts: number;
    certificates: number;
  };
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [headline, setHeadline] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Use my own id if no userId in URL (i.e., /dashboard/profile)
  const targetId = userId || me?.id;

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile', targetId],
    queryFn: async () =>
      (await api.get(`/social/users/${targetId}`)).data.user,
    enabled: !!targetId,
  });

  const { data: posts = [] } = useQuery<PostData[]>({
    queryKey: ['user-posts', targetId],
    queryFn: async () =>
      (await api.get(`/social/users/${targetId}/posts`)).data.posts,
    enabled: !!targetId,
  });

  const follow = useMutation({
    mutationFn: () => api.post(`/social/follow/${targetId}`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['profile', targetId] });
      const prev = qc.getQueryData<ProfileData>(['profile', targetId]);
      if (prev) {
        qc.setQueryData<ProfileData>(['profile', targetId], {
          ...prev,
          isFollowedByMe: true,
          _count: { ...prev._count, followers: prev._count.followers + 1 },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['profile', targetId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['profile', targetId] }),
  });

  const unfollow = useMutation({
    mutationFn: () => api.delete(`/social/follow/${targetId}`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['profile', targetId] });
      const prev = qc.getQueryData<ProfileData>(['profile', targetId]);
      if (prev) {
        qc.setQueryData<ProfileData>(['profile', targetId], {
          ...prev,
          isFollowedByMe: false,
          _count: { ...prev._count, followers: Math.max(0, prev._count.followers - 1) },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['profile', targetId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['profile', targetId] }),
  });

  const block = useMutation({
    mutationFn: () => api.post(`/social/block/${targetId}`),
    onSuccess: () => {
      alert('User blocked. You will no longer see their posts.');
      window.location.href = '/dashboard/feed';
    },
  });

  const updateProfile = useMutation({
    mutationFn: () =>
      api.patch('/social/me/profile', {
        bio: bio || undefined,
        headline: headline || undefined,
      }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['profile', targetId] });
    },
  });

  const startEdit = () => {
    setBio(profile?.bio || '');
    setHeadline(profile?.headline || '');
    setEditing(true);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB');
      return;
    }
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      await api.post('/social/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh profile to get new avatarUrl
      await qc.invalidateQueries({ queryKey: ['profile', targetId] });
      // Also refresh auth user (sidebar avatar)
      await useAuthStore.getState().hydrate();
    } catch (err: any) {
      setAvatarError(err?.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-bone-400 text-sm">Loading profile…</div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Link
            to="/dashboard/feed"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to feed
          </Link>
          <p className="mt-6 text-sm text-bone-300">User not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const displayName =
    profile.firstName || profile.lastName
      ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
      : profile.email.split('@')[0];
  const initials = (profile.firstName?.[0] || profile.email[0]).toUpperCase();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-5"
        >
          <Link
            to="/dashboard/feed"
            className="inline-flex items-center gap-2 text-bone-400 hover:text-violet-400 text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to feed
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-white/[0.06] bg-ink-900/60 overflow-hidden mb-5"
        >
          <div className="h-24 bg-gradient-to-br from-violet-500/20 to-cyan-500/10" />
          <div className="px-5 pb-5 -mt-12">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div className="relative group">
                <div className="rounded-full ring-4 ring-ink-950">
                  <Avatar user={profile} size={96} />
                </div>
                {profile.isMe && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg ring-2 ring-ink-950 disabled:opacity-50 transition-colors"
                      title="Change profile picture"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {profile.isMe ? (
                  <button
                    onClick={editing ? () => setEditing(false) : startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-bone-200 text-xs hover:bg-white/[0.03] transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    {editing ? 'Cancel' : 'Edit profile'}
                  </button>
                ) : (
                  <>
                    {profile.isFollowedByMe ? (
                      <button
                        onClick={() => unfollow.mutate()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs hover:bg-emerald-500/15 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Following
                      </button>
                    ) : (
                      <button
                        onClick={() => follow.mutate()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
                      >
                        <UserPlus className="w-3 h-3" />
                        Follow
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Block ${displayName}? You won't see their posts and they won't see yours.`)) {
                          block.mutate();
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-bone-400 text-xs hover:text-red-400 hover:border-red-500/30 transition-colors"
                      title="Block user"
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="font-display text-2xl text-bone-50">{displayName}</h1>
              {avatarError && (
                <p className="text-xs text-red-400 mt-1">{avatarError}</p>
              )}
              {!editing && profile.headline && (
                <p className="text-sm text-bone-200 mt-1">{profile.headline}</p>
              )}
              {editing && (
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Add a headline (e.g. 'JEE Aspirant · Class 12')"
                  maxLength={120}
                  className="mt-2 w-full px-3 py-1.5 bg-ink-950 border border-white/[0.08] rounded-md text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
                />
              )}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-bone-400">
                <span className="capitalize">{profile.role.replace('_', ' ').toLowerCase()}</span>
                <span className="opacity-50">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  Joined{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Bio */}
              {!editing && profile.bio && (
                <p className="mt-3 text-sm text-bone-200 leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}
              {editing && (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself…"
                  rows={4}
                  maxLength={2000}
                  className="mt-3 w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-md text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40 resize-y"
                />
              )}

              {editing && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-1.5 rounded-lg border border-white/[0.08] text-bone-300 text-xs hover:bg-white/[0.02] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateProfile.mutate()}
                    disabled={updateProfile.isPending}
                    className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                  >
                    {updateProfile.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-white/[0.06]">
              <Stat icon={<FileText className="w-3 h-3" />} label="Posts" value={profile._count.posts} />
              <Stat
                icon={<Users className="w-3 h-3" />}
                label="Followers"
                value={profile._count.followers}
              />
              <Stat
                icon={<Users className="w-3 h-3" />}
                label="Following"
                value={profile._count.following}
              />
              <Stat
                icon={<Award className="w-3 h-3" />}
                label="Certs"
                value={profile._count.certificates}
              />
            </div>
          </div>
        </motion.div>

        {/* Posts */}
        <div>
          <h2 className="font-display text-lg text-bone-50 mb-3">Posts</h2>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-8 text-center">
              <FileText className="w-8 h-8 text-bone-400/30 mx-auto mb-2" />
              <p className="text-sm text-bone-400">
                {profile.isMe ? 'You haven\'t posted yet' : `${displayName} hasn't posted yet`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div className="text-center">
    <div className="font-mono text-lg text-bone-50 font-semibold leading-none">
      {value.toLocaleString()}
    </div>
    <div className="flex items-center justify-center gap-1 text-[10px] text-bone-400 uppercase tracking-wider mt-1 font-medium">
      {icon}
      {label}
    </div>
  </div>
);
