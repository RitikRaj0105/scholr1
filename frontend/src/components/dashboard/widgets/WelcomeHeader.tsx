import { useQuery } from '@tanstack/react-query';
import { Flame, Star, Quote as QuoteIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface FocusStats {
  todayMinutes: number;
  weekMinutes: number;
  currentStreak: number;
  totalSessions: number;
}

interface Quote {
  text: string;
  author: string;
}

export const WelcomeHeader = () => {
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery<FocusStats>({
    queryKey: ['focus-stats'],
    queryFn: async () => (await api.get('/focus/stats')).data,
  });

  const { data: quoteResp } = useQuery<{ quote: Quote }>({
    queryKey: ['daily-quote'],
    queryFn: async () => (await api.get('/planner/quote')).data,
    staleTime: 1000 * 60 * 60 * 12,
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Today's progress: 4h focus = 100%
  const target = 240;
  const dailyProgress = Math.min(
    100,
    Math.round(((stats?.todayMinutes ?? 0) / target) * 100)
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 p-7 bg-gradient-to-br from-violet-500/15 via-ink-900 to-cyan-500/10">
      {/* Aurora glows */}
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-bone-400 uppercase tracking-[0.2em] mb-2">
              {greeting},
            </div>
            <h1 className="font-display text-4xl text-bone-50 leading-tight">
              {user?.firstName ? (
                <>
                  {user.firstName}.{' '}
                  <span className="italic text-bone-300">Let's go.</span>
                </>
              ) : (
                <>Welcome back.</>
              )}
            </h1>
            <p className="text-bone-300/80 text-sm mt-2">
              {user?.role === 'STUDENT'
                ? 'Your study cockpit. Pick up where you left off.'
                : user?.role === 'TEACHER'
                ? 'Your teaching deck. Classrooms and assignments inside.'
                : 'Your operating system for student success.'}
            </p>
          </div>

          {/* Streak badge */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-ink-950/40 backdrop-blur-sm rounded-2xl px-5 py-4 border border-orange-400/20">
            <Flame className="w-6 h-6 text-orange-400 mb-1" />
            <div className="font-display text-3xl text-bone-50 leading-none tabular-nums">
              {stats?.currentStreak ?? 0}
            </div>
            <div className="text-[10px] text-bone-400 uppercase tracking-wider mt-1">
              day streak
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-bone-400">
              Today's progress
            </span>
            <span className="text-sm text-bone-100 tabular-nums">
              {stats?.todayMinutes ?? 0}m / {target}m · {dailyProgress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-magenta-500 transition-all duration-700"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
        </div>

        {/* Quote */}
        {quoteResp?.quote && (
          <div className="flex items-start gap-3 bg-ink-950/40 border border-white/5 rounded-2xl p-4">
            <QuoteIcon className="w-4 h-4 text-violet-300 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-bone-100 italic leading-relaxed text-sm">
                {quoteResp.quote.text}
              </p>
              <p className="text-bone-400 text-xs mt-1">
                — {quoteResp.quote.author}
              </p>
            </div>
          </div>
        )}

        {/* XP strip */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span className="text-bone-100 tabular-nums">
            {(stats?.totalSessions ?? 0) * 25} XP
          </span>
          <span className="text-bone-400">
            · from {stats?.totalSessions ?? 0} sessions
          </span>
        </div>
      </div>
    </div>
  );
};
