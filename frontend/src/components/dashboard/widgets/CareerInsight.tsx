import { Compass, ChevronRight, TrendingUp } from 'lucide-react';

const TOP_CAREER = {
  title: 'AI / Machine Learning Engineer',
  match: 92,
  salary: '₹18–45 LPA',
  growth: '+32% yoy',
  skills: ['Python', 'Linear Algebra', 'PyTorch', 'Statistics'],
};

export const CareerInsight = () => {
  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-base text-bone-50 flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-300" />
          Career insight
        </div>
        <button className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
          Explore <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="rounded-xl bg-ink-950/40 border border-white/5 p-4">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            <div className="text-sm text-bone-50 mb-1">{TOP_CAREER.title}</div>
            <div className="text-xs text-bone-400">{TOP_CAREER.salary}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-display text-3xl text-cyan-300 leading-none tabular-nums">
              {TOP_CAREER.match}%
            </div>
            <div className="text-[10px] text-bone-400 uppercase tracking-wider">
              match
            </div>
            <div className="flex items-center gap-1 mt-1 justify-end text-[10px] text-cyan-300">
              <TrendingUp className="w-2.5 h-2.5" />
              {TOP_CAREER.growth}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {TOP_CAREER.skills.map((s) => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-bone-400 mt-3">
        Based on your strengths · Computed weekly
      </p>
    </div>
  );
};
