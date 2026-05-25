import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from './Avatar';

interface Conversation {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    headline: string | null;
  };
  lastMessage: { content: string; createdAt: string; fromMe: boolean; read: boolean };
  unread: number;
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

export const MessagesBell = () => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: unread = 0 } = useQuery<number>({
    queryKey: ['messages-unread'],
    queryFn: async () => (await api.get('/messages/unread-count')).data.count,
    refetchInterval: 20_000,
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations-preview'],
    queryFn: async () => (await api.get('/messages/conversations')).data.conversations,
    enabled: open,
    staleTime: 10_000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg border border-white/[0.06] text-bone-300 hover:text-bone-100 hover:bg-white/[0.03] flex items-center justify-center transition-colors"
        title="Messages"
      >
        <Send className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/[0.08] bg-ink-900 shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-semibold text-sm text-bone-100">Messages</h3>
              <Link
                to="/dashboard/messages"
                onClick={() => setOpen(false)}
                className="text-[11px] text-violet-400 hover:text-violet-300"
              >
                Open inbox
              </Link>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-bone-500/40" />
                  <p className="text-xs text-bone-400">No conversations yet</p>
                  <p className="text-[10px] text-bone-500 mt-1">Visit someone's profile and click Message to start one.</p>
                </div>
              ) : (
                conversations.slice(0, 8).map((c) => (
                  <Link
                    key={c.user.id}
                    to={`/dashboard/messages/${c.user.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    <Avatar user={c.user} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-bone-100 truncate">
                          {c.user.firstName} {c.user.lastName}
                        </p>
                        <span className="text-[10px] text-bone-500 flex-shrink-0">
                          {timeAgo(c.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-[11px] truncate ${c.unread > 0 ? 'text-bone-200 font-medium' : 'text-bone-400'}`}>
                          {c.lastMessage.fromMe && 'You: '}
                          {c.lastMessage.content}
                        </p>
                        {c.unread > 0 && (
                          <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-violet-500 text-[9px] text-white font-bold flex items-center justify-center flex-shrink-0">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
