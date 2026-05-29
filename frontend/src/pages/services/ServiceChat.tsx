import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import './styles/ServiceChat.css';

export default function ServiceChat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    load();
    // Poll every 5s for new messages (simpler than WebSockets for v1)
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages?.length]);

  async function load() {
    try {
      const { data } = await api.get(`/services/chat/${bookingId}`);
      setChat(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/services/chat/${bookingId}/messages`, { content });
      setContent('');
      load();
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="sc-wrapper"><div className="sc-loading">Loading chat…</div></div>;
  }

  return (
    <div className="sc-wrapper">
      <div className="sc-header">
        <button className="sc-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="sc-title">Service Chat</div>
      </div>

      <div className="sc-messages">
        {chat?.messages?.length === 0 ? (
          <div className="sc-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chat?.messages?.map((m: any) => {
            const mine = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`sc-bubble ${mine ? 'sc-bubble-mine' : 'sc-bubble-theirs'}`}
              >
                <div className="sc-bubble-content">{m.content}</div>
                <div className="sc-bubble-time">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form className="sc-input-row" onSubmit={send}>
        <input
          className="sc-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message…"
          maxLength={1000}
        />
        <button type="submit" className="sc-send" disabled={sending || !content.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
