import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from './Avatar';

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
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getIcon(type: string) {
  if (type === 'POST_LIKE') return <Heart className="w-3 h-3 text-red-400" />;
  if (type === 'POST_COMMENT') return <MessageCircle className="w-3 h-3 text-cyan-400" />;
  if (type === 'FOLLOW') return <UserPlus className="w-3 h-3 text-violet-400" />;
  return <Bell className="w-3 h-3 text-bone-400" />;
}

export const NotificationBell = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['notification-count'],
    queryFn: async () => (await api.get('/notifications/unread-count')).data,
    refetchInterval: 30_000, // Poll every 30s
  });

  const { data: notifs = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications-list'],
    queryFn: async () => (await api.get('/notifications?limit=10')).data.notifications,
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const count = countData?.count ?? 0;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg border border-white/[0.06] text-bone-300 hover:text-bone-100 hover:bg-white/[0.03] flex items-center justify-center transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/[0.08] bg-ink-900 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-medium text-bone-50">Notifications</h3>
              {count > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-bone-400/30 mx-auto mb-2" />
                  <p className="text-xs text-bone-400">No notifications yet</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const content = (
                    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer ${!n.read ? 'bg-violet-500/[0.04]' : ''}`}>
                      {n.fromUser ? (
                        <Avatar user={n.fromUser} size={32} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ink-800 flex items-center justify-center flex-shrink-0">
                          {getIcon(n.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-bone-100 leading-snug">{n.title}</p>
                        {n.body && (
                          <p className="text-[11px] text-bone-400 truncate mt-0.5">{n.body}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          {getIcon(n.type)}
                          <span className="text-[10px] text-bone-400">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  );
                  return n.link ? (
                    <Link
                      key={n.id}
                      to={n.link}
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={n.id}
                      className="block w-full text-left"
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id);
                      }}
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>

            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-violet-400 hover:text-violet-300 py-3 border-t border-white/[0.06] transition-colors"
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
