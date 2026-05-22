import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Search, MessageSquare, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Conversation {
  user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; headline: string | null };
  lastMessage: { content: string; createdAt: string; fromMe: boolean; read: boolean };
  unread: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export default function Messages() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);

  const { data: convs = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => (await api.get('/messages/conversations')).data.conversations,
    refetchInterval: 15000,
  });

  return (
    <DashboardLayout>
      <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-7rem)]">
        {/* Conversations list */}
        <aside className={`rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col ${userId ? 'hidden md:flex' : ''}`}>
          <div className="px-4 py-3 border-b border-zinc-800">
            <h1 className="font-display text-xl text-white">Messages</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{convs.length} conversation{convs.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convs.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                No conversations yet.<br />
                Visit a user's profile and click <span className="text-violet-400">Message</span> to start one.
              </div>
            ) : (
              convs.map((c) => (
                <Link
                  key={c.user.id}
                  to={`/dashboard/messages/${c.user.id}`}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
                    userId === c.user.id ? 'bg-zinc-800/60' : ''
                  }`}
                >
                  <Avatar user={c.user} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {c.user.firstName} {c.user.lastName}
                      </p>
                      <span className="text-[10px] text-zinc-500 flex-shrink-0">
                        {formatTime(c.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${c.unread > 0 ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
                        {c.lastMessage.fromMe && 'You: '}
                        {c.lastMessage.content}
                      </p>
                      {c.unread > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-violet-500 text-[10px] text-white font-bold flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* Thread / empty state */}
        <main className={`rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden ${userId ? '' : 'hidden md:block'}`}>
          {userId ? <Thread userId={userId} me={me?.id || ''} /> : <EmptyState />}
        </main>
      </div>
    </DashboardLayout>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-violet-400" />
      </div>
      <h2 className="font-display text-xl text-white mb-1">Your messages</h2>
      <p className="text-sm text-zinc-400 max-w-sm">
        Pick a conversation from the left, or visit someone's profile and click <span className="text-violet-400">Message</span> to start a new one.
      </p>
    </div>
  );
}

function Thread({ userId, me }: { userId: string; me: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<{ user: Conversation['user']; messages: Message[] }>({
    queryKey: ['thread', userId],
    queryFn: async () => (await api.get(`/messages/${userId}`)).data,
    refetchInterval: 5000,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages]);

  // Invalidate conversation list when opening a thread (clears unread badge)
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['messages-unread'] });
  }, [userId, data, qc]);

  const send = useMutation({
    mutationFn: (content: string) => api.post(`/messages/${userId}`, { content }),
    onSuccess: () => {
      setInput('');
      qc.invalidateQueries({ queryKey: ['thread', userId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    send.mutate(text);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>;
  if (!data) return <EmptyState />;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
        <button onClick={() => navigate('/dashboard/messages')} className="md:hidden p-1 hover:bg-zinc-800 rounded">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </button>
        <Link to={`/dashboard/profile/${data.user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar user={data.user} size={38} />
          <div>
            <p className="text-sm font-medium text-white">{data.user.firstName} {data.user.lastName}</p>
            {data.user.headline && <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">{data.user.headline}</p>}
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {data.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-zinc-500">
            No messages yet. Say hi!
          </div>
        ) : (
          data.messages.map((m, i) => {
            const mine = m.senderId === me;
            const prev = data.messages[i - 1];
            const showAvatar = !prev || prev.senderId !== m.senderId;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
              >
                {!mine && showAvatar && <Avatar user={data.user} size={28} />}
                {!mine && !showAvatar && <div className="w-7" />}
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                    mine
                      ? 'bg-violet-600 text-white rounded-br-md'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`text-[9px] mt-0.5 ${mine ? 'text-violet-200' : 'text-zinc-500'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || send.isPending}
            className="p-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
