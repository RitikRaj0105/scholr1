import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertTriangle, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

interface UpcomingExam {
  id: string;
  title: string;
  type: string;
  startsAt: string | null;
  durationMin: number;
  totalMarks: number;
  daysLeft: number | null;
  _count: { questions: number };
}

export const UpcomingExams = () => {
  const navigate = useNavigate();
  const { data: exams = [], isLoading } = useQuery<UpcomingExam[]>({
    queryKey: ['upcoming-exams'],
    queryFn: async () => (await api.get('/planner/exams/upcoming')).data.exams,
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-display text-xl text-bone-50">Upcoming exams</div>
          <div className="text-xs text-bone-400 mt-0.5">
            {exams.length} scheduled
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/tests')}
          className="text-sm text-violet-300 hover:text-violet-200 flex items-center gap-1"
        >
          Tests <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {isLoading && (
        <div className="text-sm text-bone-400 py-4">Loading…</div>
      )}

      {!isLoading && exams.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-ink-950/30 p-6 text-center">
          <Calendar className="w-7 h-7 text-bone-400/50 mx-auto mb-2" />
          <div className="text-sm text-bone-300">No upcoming exams</div>
          <div className="text-xs text-bone-400/70 mt-1">
            Tests with a start date will appear here
          </div>
        </div>
      )}

      <div className="space-y-2">
        {exams.map((exam) => {
          const urgent = exam.daysLeft != null && exam.daysLeft <= 7;
          return (
            <div
              key={exam.id}
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-violet-500/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      urgent ? 'bg-magenta-400' : 'bg-violet-400'
                    }`}
                  />
                  <span className="text-sm text-bone-50 truncate">
                    {exam.title}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                    urgent ? 'text-magenta-300' : 'text-bone-400'
                  }`}
                >
                  {urgent && <AlertTriangle className="w-3 h-3" />}
                  <span className="tabular-nums">{exam.daysLeft}d</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-bone-400">
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-300 uppercase tracking-wider">
                  {exam.type}
                </span>
                <span>{exam._count.questions} qs</span>
                <span>{exam.durationMin}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
