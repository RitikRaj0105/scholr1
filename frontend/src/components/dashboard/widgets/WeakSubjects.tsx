import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, ChevronRight, Activity } from 'lucide-react';
import { api } from '@/lib/api';

interface ExamStats {
  totalAttempts: number;
  masteryByType: { type: string; percentage: number; count: number }[];
}

export const WeakSubjects = () => {
  const navigate = useNavigate();
  const { data: stats } = useQuery<ExamStats>({
    queryKey: ['exam-stats'],
    queryFn: async () => (await api.get('/exams/stats')).data.stats,
  });

  // Derive "weak" = lowest mastery, take 3
  const weak = (stats?.masteryByType ?? [])
    .filter((m) => m.count > 0)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-display text-xl text-bone-50">Weak areas</div>
          <div className="text-xs text-bone-400 mt-0.5">
            By exam type mastery
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/tests')}
          className="text-sm text-violet-300 hover:text-violet-200 flex items-center gap-1"
        >
          Tests <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {weak.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-ink-950/30 p-5 text-center">
          <Activity className="w-7 h-7 text-bone-400/50 mx-auto mb-2" />
          <div className="text-sm text-bone-300">No attempt data yet</div>
          <div className="text-xs text-bone-400/70 mt-1">
            Take a few tests to see your weak topics
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {weak.map((m) => {
            const tone =
              m.percentage >= 70
                ? 'from-cyan-400 to-cyan-500'
                : m.percentage >= 50
                ? 'from-violet-400 to-violet-500'
                : 'from-magenta-400 to-magenta-500';
            const textTone =
              m.percentage >= 70
                ? 'text-cyan-300'
                : m.percentage >= 50
                ? 'text-violet-300'
                : 'text-magenta-300';
            return (
              <div
                key={m.type}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-magenta-500/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-bone-100">{m.type}</span>
                  <div className="flex items-center gap-1.5">
                    {m.percentage < 50 && (
                      <TrendingDown className="w-3 h-3 text-magenta-300" />
                    )}
                    <span className={`text-xs font-medium ${textTone}`}>
                      {m.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${tone}`}
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-bone-400/70 mt-1.5">
                  {m.count} attempt{m.count === 1 ? '' : 's'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
