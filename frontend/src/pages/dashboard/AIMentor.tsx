import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Brain, Trash2, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import { useAuthStore } from '@/store/authStore';

interface Chat {
  id: string;
  title: string;
  mode: 'GENERAL' | 'STUDY' | 'CAREER' | 'WELLNESS' | 'CODING';
  createdAt: string;
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

const MODES = [
  { id: 'GENERAL', label: 'General' },
  { id: 'STUDY', label: 'Study help' },
  { id: 'CODING', label: 'Coding' },
  { id: 'CAREER', label: 'Career' },
  { id: 'WELLNESS', label: 'Wellness' },
] as const;

const SUGGESTED_PROMPTS = [
  'Build me a 4-week study plan for organic chemistry',
  'Explain backpropagation like I\'m a first-year CS student',
  'Help me prep for a software engineering internship interview',
  'I\'m burning out. What should I do this weekend?',
];

export default function AIMentor() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ['ai-chats'],
    queryFn: async () => (await api.get('/ai/chats')).data.chats,
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['ai-chat', activeChatId],
    queryFn: async () => (await api.get(`/ai/chats/${activeChatId}`)).data.messages,
    enabled: !!activeChatId,
  });

  const createChat = useMutation({
    mutationFn: async (mode: Chat['mode']) =>
      (await api.post('/ai/chats', { mode, title: 'New conversation' })).data.chat,
    onSuccess: (chat: Chat) => {
      qc.invalidateQueries({ queryKey: ['ai-chats'] });
      setActiveChatId(chat.id);
    },
  });

  const deleteChat = useMutation({
    mutationFn: async (id: string) => api.delete(`/ai/chats/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-chats'] });
      setActiveChatId(null);
    },
  });

  const { stream, streaming } = useSSE({
    onDelta: (text) => setStreamingText((prev) => prev + text),
    onDone: () => {
      qc.invalidateQueries({ queryKey: ['ai-chat', activeChatId] });
      setStreamingText('');
    },
    onError: (err) => {
      console.error(err);
      setStreamingText('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const send = async () => {
    if (!input.trim() || !activeChatId || streaming) return;
    const text = input.trim();
    setInput('');
    setStreamingText('');
    // Optimistic insert
    qc.setQueryData<Message[]>(['ai-chat', activeChatId], (old = []) => [
      ...old,
      {
        id: `temp-${Date.now()}`,
        role: 'USER',
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
    await stream(
      `${baseURL}/ai/chats/${activeChatId}/messages`,
      { content: text },
      accessToken
    );
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex">
        {/* Chat list */}
        <aside className="w-72 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <button
              onClick={() => createChat.mutate('GENERAL')}
              disabled={createChat.isPending}
              className="w-full px-4 py-2.5 rounded-xl bg-bone-50 text-ink-950 text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats?.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl group flex items-start gap-2 transition-colors ${
                  activeChatId === chat.id
                    ? 'bg-white/5'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <Brain className="w-4 h-4 mt-0.5 text-bone-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-bone-100 truncate">
                    {chat.title}
                  </div>
                  <div className="text-xs text-bone-400/70">{chat.mode}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat.mutate(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-bone-400 hover:text-magenta-300 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
            {!chats?.length && (
              <div className="text-center text-bone-400/60 text-sm py-8 px-4">
                No conversations yet. Start one.
              </div>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!activeChatId ? (
            <EmptyState onStart={(mode) => createChat.mutate(mode)} />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages?.map((msg) => (
                    <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
                  ))}
                  {streamingText && (
                    <MessageBubble role="ASSISTANT" content={streamingText} streaming />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-white/5 px-8 py-5">
                <div className="max-w-3xl mx-auto">
                  <div className="relative rounded-2xl border border-white/10 bg-ink-900/60 backdrop-blur-sm focus-within:border-violet-500/40 transition-colors">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder="Ask anything…"
                      rows={1}
                      className="w-full bg-transparent text-bone-50 placeholder:text-bone-400/50 px-5 py-4 pr-14 resize-none focus:outline-none"
                    />
                    <button
                      onClick={send}
                      disabled={streaming || !input.trim()}
                      className="absolute right-2 bottom-2 w-10 h-10 rounded-xl bg-bone-50 text-ink-950 flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-bone-400/60 mt-2 text-center">
                    Scholr can make mistakes. Verify important info.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const MessageBubble = ({
  role,
  content,
  streaming,
}: {
  role: Message['role'];
  content: string;
  streaming?: boolean;
}) => {
  if (role === 'USER') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-2xl px-5 py-3 rounded-2xl rounded-br-md bg-violet-500/20 border border-violet-500/30 text-bone-50">
          {content}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 pt-1.5">
        <div className="text-bone-100 leading-relaxed whitespace-pre-wrap">
          {content}
          {streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-400 animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ onStart }: { onStart: (mode: Chat['mode']) => void }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="max-w-2xl text-center">
      <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 items-center justify-center mb-6">
        <Brain className="w-7 h-7 text-white" />
      </div>
      <h2 className="font-display text-4xl text-bone-50 mb-3">
        How can I help you <span className="italic text-bone-300">today?</span>
      </h2>
      <p className="text-bone-300/80 mb-10">
        Pick a mode to set context, then ask anything.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onStart(m.id)}
            className="px-4 py-2 rounded-full border border-white/10 text-sm text-bone-200 hover:bg-white/5 hover:border-white/20 transition-all"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-left">
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => onStart('GENERAL')}
            className="px-5 py-4 rounded-xl border border-white/10 bg-ink-900/40 text-sm text-bone-200 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left flex items-start gap-3"
          >
            <Sparkles className="w-4 h-4 text-violet-300 mt-0.5 flex-shrink-0" />
            <span>{p}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
