import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

type Mood = 'TERRIBLE' | 'LOW' | 'NEUTRAL' | 'GOOD' | 'GREAT';

const MOODS: { mood: Mood; emoji: string; label: string }[] = [
  { mood: 'TERRIBLE', emoji: '😞', label: 'Terrible' },
  { mood: 'LOW', emoji: '😕', label: 'Low' },
  { mood: 'NEUTRAL', emoji: '😐', label: 'Neutral' },
  { mood: 'GOOD', emoji: '🙂', label: 'Good' },
  { mood: 'GREAT', emoji: '🤩', label: 'Great' },
];

interface MoodLog {
  id: string;
  mood: Mood;
  loggedAt: string;
}

export const MoodCheckin = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Mood | null>(null);

  const { data: todayLog } = useQuery<{ log: MoodLog | null }>({
    queryKey: ['mood-today'],
    queryFn: async () => (await api.get('/planner/mood/today')).data,
  });

  const log = useMutation({
    mutationFn: async (mood: Mood) =>
      (await api.post('/planner/mood', { mood })).data.log,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood-today'] });
    },
  });

  const loggedToday = todayLog?.log;

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-base text-bone-50 flex items-center gap-2">
          <Heart className="w-4 h-4 text-magenta-300" />
          Mood check-in
        </div>
        <button
          onClick={() => navigate('/dashboard/wellness')}
          className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1"
        >
          Wellness <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {loggedToday ? (
        <div className="text-center py-3">
          <div className="text-4xl mb-2">
            {MOODS.find((m) => m.mood === loggedToday.mood)?.emoji}
          </div>
          <div className="text-sm text-bone-50">
            Feeling{' '}
            <span className="text-violet-300">
              {MOODS.find((m) => m.mood === loggedToday.mood)?.label}
            </span>{' '}
            today
          </div>
          <div className="flex items-center gap-1.5 justify-center mt-2 text-xs text-bone-400">
            <Sparkles className="w-3 h-3" />
            Logged · view trends in Wellness
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-bone-400 mb-4">
            How are you feeling right now?
          </p>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {MOODS.map((m) => {
              const active = selected === m.mood;
              return (
                <button
                  key={m.mood}
                  onClick={() => setSelected(m.mood)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all border ${
                    active
                      ? 'border-violet-500/50 bg-violet-500/10 scale-105'
                      : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span
                    className={`text-[10px] ${
                      active ? 'text-violet-200' : 'text-bone-400'
                    }`}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => selected && log.mutate(selected)}
            disabled={!selected || log.isPending}
            className="w-full py-2.5 bg-bone-50 text-ink-950 text-sm font-medium rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {log.isPending ? 'Logging…' : 'Log mood'}
          </button>
        </>
      )}
    </div>
  );
};
