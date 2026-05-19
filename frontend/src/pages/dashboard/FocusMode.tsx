import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, ShieldOff, Shield } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

type Mode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

const DURATIONS: Record<Mode, number> = {
  FOCUS: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
};

const BLOCKED_SITES = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Twitter / X',
  'Discord',
  'Facebook',
  'Snapchat',
  'Reddit',
];

export default function FocusMode() {
  const [mode, setMode] = useState<Mode>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.FOCUS);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const startSession = useMutation({
    mutationFn: async () =>
      (
        await api.post('/focus/sessions', {
          type: mode,
          plannedMinutes: DURATIONS[mode] / 60,
        })
      ).data,
    onSuccess: (data) => setSessionId(data.session.id),
  });

  const endSession = useMutation({
    mutationFn: async (id: string) =>
      (
        await api.patch(`/focus/sessions/${id}/end`, {
          actualMinutes: (DURATIONS[mode] - timeLeft) / 60,
          completed: timeLeft === 0,
        })
      ).data,
    onSuccess: () => setSessionId(null),
  });

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setRunning(false);
            if (sessionId) endSession.mutate(sessionId);
            // Audio cue
            try {
              new Audio(
                'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ=='
              ).play().catch(() => {});
            } catch {}
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, sessionId, endSession]);

  const onStart = () => {
    if (!sessionId) startSession.mutate();
    setRunning(true);
  };

  const onPause = () => setRunning(false);

  const onReset = () => {
    setRunning(false);
    setTimeLeft(DURATIONS[mode]);
    if (sessionId) {
      endSession.mutate(sessionId);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    setRunning(false);
    if (sessionId) endSession.mutate(sessionId);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / DURATIONS[mode];

  return (
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Ambient mode glow */}
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[180px] ${
              mode === 'FOCUS'
                ? 'bg-violet-500/20'
                : mode === 'SHORT_BREAK'
                ? 'bg-cyan-500/15'
                : 'bg-magenta-500/15'
            }`}
          />
        </motion.div>

        <div className="relative p-8 max-w-5xl mx-auto">
          {/* Mode tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 rounded-full border border-white/10 bg-ink-900/60 backdrop-blur-sm">
              {(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`relative px-5 py-2 text-sm rounded-full transition-colors ${
                    mode === m ? 'text-ink-950' : 'text-bone-300'
                  }`}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="focus-mode-bg"
                      className="absolute inset-0 bg-bone-50 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    {m === 'FOCUS' ? 'Focus' : m === 'SHORT_BREAK' ? 'Short break' : 'Long break'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center mb-16">
            <div className="relative w-[400px] h-[400px] mb-10">
              {/* Outer ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="92"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r="92"
                  fill="none"
                  stroke="url(#timerGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 92}
                  strokeDashoffset={2 * Math.PI * 92 * (1 - progress)}
                  transition={{ duration: 1, ease: 'linear' }}
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs uppercase tracking-[0.3em] text-bone-400 mb-3">
                  {mode === 'FOCUS' ? 'Deep work' : 'Recharge'}
                </div>
                <div className="font-display text-[8rem] leading-none text-bone-50 tabular-nums">
                  {String(minutes).padStart(2, '0')}
                  <span className="text-bone-400/40">:</span>
                  {String(seconds).padStart(2, '0')}
                </div>
                <div className="text-sm text-bone-400 mt-3">
                  {running ? 'In progress' : sessionId ? 'Paused' : 'Ready'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={onReset}
                className="w-12 h-12 rounded-full border border-white/10 text-bone-300 hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={running ? onPause : onStart}
                className="w-16 h-16 rounded-full bg-bone-50 text-ink-950 hover:bg-white transition-colors flex items-center justify-center shadow-lg"
              >
                {running ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>
              <button
                onClick={() => setBlocking((b) => !b)}
                title={blocking ? 'Distraction blocking on' : 'Distraction blocking off'}
                className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center ${
                  blocking
                    ? 'border-violet-500/40 text-violet-300 bg-violet-500/10'
                    : 'border-white/10 text-bone-400 hover:border-white/20'
                }`}
              >
                {blocking ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <ShieldOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Blocked sites */}
          {mode === 'FOCUS' && blocking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-ink-900/40 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-violet-300" />
                  <span className="text-sm uppercase tracking-wider text-bone-400">
                    Blocked during focus
                  </span>
                </div>
                <span className="text-xs text-bone-400/60">
                  Requires Scholr extension
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BLOCKED_SITES.map((site) => (
                  <span
                    key={site}
                    className="px-3 py-1.5 rounded-full bg-ink-950/60 border border-white/5 text-xs text-bone-300"
                  >
                    {site}
                  </span>
                ))}
              </div>
              <p className="text-xs text-bone-400/70 mt-4">
                Install the Scholr browser extension or mobile companion to enable
                hard blocking. Without it, you'll only get nag-walls.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
