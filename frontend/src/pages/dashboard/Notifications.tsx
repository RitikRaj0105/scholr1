import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Trash2, CheckCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getIcon(type: string) {
  if (type === 'POST_LIKE') return <Heart className="w-4 h-4 text-red-400" />;
  if (type === 'POST_COMMENT') return <MessageCircle className="w-4 h-4 text-cyan-400" />;
  if (type === 'FOLLOW') return <UserPlus className="w-4 h-4 text-violet-400" />;
  return <Bell className="w-4 h-4 text-bone-400" />;
}

export default function Notifications() {
  const qc = useQueryClient();

  const { data: notifs = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications-full'],
    queryFn: async () => (await api.get('/notifications?limit=100')).data.notifications,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-full'] });
      qc.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications-full'] });
      const prev = qc.getQueryData<NotificationItem[]>(['notifications-full']);
      qc.setQueryData<NotificationItem[]>(['notifications-full'], (old = []) =>
        old.filter((n) => n.id !== id)
      );
      return { prev };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications-full'] });
      qc.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-full'] });
      qc.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 flex items-end justify-between gap-3 flex-wrap"
        >
          <div>
            <p className="text-xs text-violet-400 font-medium uppercase tracking-wider mb-1">
              Activity
            </p>
            <h1 className="font-display text-3xl text-bone-50">
              Notifications
              {unreadCount > 0 && (
                <span className="text-violet-400 text-xl ml-2 font-mono">
                  {unreadCount} new
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] text-bone-300 hover:bg-white/[0.03] text-xs transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </motion.div>

        {isLoading && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-10 text-center text-bone-400 text-sm">
            Loading…
          </div>
        )}

        {!isLoading && notifs.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-10 text-center">
            <Bell className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
            <p className="text-sm text-bone-300 mb-1">No notifications yet</p>
            <p className="text-xs text-bone-400">
              When people like, comment on, or follow you, you'll see it here
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 overflow-hidden">
          <AnimatePresence initial={false}>
            {notifs.map((n) => {
              const content = (
                <div className={`flex items-start gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors group ${!n.read ? 'bg-violet-500/[0.04]' : ''}`}>
                  {n.fromUser ? (
                    <Avatar user={n.fromUser} size={40} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-ink-800 flex items-center justify-center flex-shrink-0">
                      {getIcon(n.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-bone-100 leading-snug">{n.title}</p>
                    {n.body && <p className="text-xs text-bone-300 mt-0.5">{n.body}</p>}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {getIcon(n.type)}
                      <span className="text-[11px] text-bone-400">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotif.mutate(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-bone-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="border-b border-white/[0.04] last:border-b-0"
                >
                  {n.link ? (
                    <Link
                      to={n.link}
                      onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      className="block w-full text-left"
                      onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                    >
                      {content}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
