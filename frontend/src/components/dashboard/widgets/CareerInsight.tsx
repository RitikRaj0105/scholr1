import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Compass, TrendingUp, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface CareerCard {
  slug: string;
  title: string;
  icon: string;
  matchScore: number;
  salaryRange: string;
  growthRate: string;
  skills: string[];
}

export const CareerInsight = () => {
  const { data: careers = [], isLoading } = useQuery<CareerCard[]>({
    queryKey: ['careers', 'top'],
    queryFn: async () => (await api.get('/career/profiles')).data.careers,
  });

  const top = careers[0];

  return (
    <div className="rounded-2xl border border-cyan-500/10 bg-ink-900/60 p-5">
      <h3 className="font-display text-base text-bone-50 flex items-center gap-2 mb-3">
        <Compass className="w-4 h-4 text-cyan-400" /> Career Insight
      </h3>

      {isLoading && (
        <div className="rounded-lg bg-ink-800/60 border border-white/[0.04] p-3 text-xs text-bone-400">
          Computing your match…
        </div>
      )}

      {top && (
        <Link
          to={`/dashboard/career/${top.slug}`}
          className="group block rounded-lg bg-ink-800/60 border border-white/[0.04] hover:border-cyan-500/25 p-3 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-2xl flex-shrink-0">{top.icon}</span>
              <div className="min-w-0">
                <p className="text-sm text-bone-100 font-medium truncate">{top.title}</p>
                <p className="text-xs text-bone-400 mt-0.5">{top.salaryRange}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-mono text-2xl text-cyan-400 font-semibold leading-none">{top.matchScore}%</div>
              <div className="text-[10px] text-bone-400">match</div>
              <div className="flex items-center gap-1 mt-0.5 justify-end text-[10px] text-emerald-400">
                <TrendingUp className="w-2.5 h-2.5" />{top.growthRate}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {top.skills.slice(0, 4).map((s) => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/15">{s}</span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] text-bone-400">View roadmap</span>
            <ArrowRight className="w-3 h-3 text-bone-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      )}

      <Link to="/dashboard/career" className="block mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors text-center">
        Explore all career paths →
      </Link>
    </div>
  );
};
