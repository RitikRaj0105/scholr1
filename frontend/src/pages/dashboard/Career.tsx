import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Briefcase,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

interface CareerCard {
  slug: string;
  title: string;
  icon: string;
  category: 'tech' | 'science' | 'business' | 'creative' | 'healthcare';
  salaryRange: string;
  growthRate: string;
  demandLevel: 'high' | 'medium' | 'low';
  skills: string[];
  matchScore: number;
}

const CATEGORIES = [
  { id: 'all', label: 'All paths' },
  { id: 'tech', label: 'Tech' },
  { id: 'science', label: 'Science' },
  { id: 'business', label: 'Business' },
  { id: 'creative', label: 'Creative' },
  { id: 'healthcare', label: 'Healthcare' },
];

const CATEGORY_COLORS: Record<string, string> = {
  tech: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
  science: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
  business: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
  creative: 'text-pink-400 bg-pink-500/10 border-pink-500/15',
  healthcare: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
};

const DEMAND_COLORS = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-bone-400',
};

export default function Career() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const { data: careers = [], isLoading } = useQuery<CareerCard[]>({
    queryKey: ['careers', category, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      return (await api.get(`/career/profiles?${params.toString()}`)).data.careers;
    },
  });

  const topMatch = careers[0];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-xs text-violet-400 font-medium uppercase tracking-wider mb-1">
            Career Explorer
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-bone-50 mb-2">
            Find your <span className="text-violet-400">path.</span>
          </h1>
          <p className="text-sm text-bone-300 max-w-2xl">
            Career profiles matched to your actual test performance and coding work. Higher match = stronger overlap with skills you're already building.
          </p>
        </motion.div>

        {/* Top match banner */}
        {topMatch && topMatch.matchScore >= 50 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-5 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.08] to-cyan-500/[0.05] p-5 flex items-center gap-4 flex-wrap"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-2xl flex-shrink-0">
              {topMatch.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <p className="text-[10px] text-violet-400 uppercase tracking-wider font-medium">
                  Your top match
                </p>
              </div>
              <h2 className="font-display text-xl text-bone-50 truncate">
                {topMatch.title}
              </h2>
              <p className="text-xs text-bone-300 mt-0.5">
                {topMatch.matchScore}% match · {topMatch.salaryRange}
              </p>
            </div>
            <Link
              to={`/dashboard/career/${topMatch.slug}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              Explore path
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {/* Filters */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search careers or skills…"
              className="w-full pl-10 pr-4 py-2 bg-ink-900/60 border border-white/[0.06] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === c.id
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                    : 'border border-white/[0.06] text-bone-300 hover:bg-white/[0.03]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-12 text-center text-bone-400 text-sm">
            Loading careers…
          </div>
        )}

        {!isLoading && careers.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-12 text-center">
            <Briefcase className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
            <p className="text-bone-300 text-sm">No careers match your filters</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {careers.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                to={`/dashboard/career/${c.slug}`}
                className="group block rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5 hover:border-violet-500/25 hover:bg-ink-900/80 transition-all h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl">
                    {c.icon}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-semibold text-violet-400 leading-none">
                      {c.matchScore}%
                    </div>
                    <div className="text-[9px] text-bone-400 uppercase tracking-wider mt-0.5">
                      match
                    </div>
                  </div>
                </div>

                <h3 className="font-display text-lg text-bone-50 mb-1 leading-tight">
                  {c.title}
                </h3>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium ${
                      CATEGORY_COLORS[c.category]
                    }`}
                  >
                    {c.category}
                  </span>
                  <span className="text-[10px] text-bone-400 flex items-center gap-1">
                    <TrendingUp className={`w-2.5 h-2.5 ${DEMAND_COLORS[c.demandLevel]}`} />
                    {c.growthRate}
                  </span>
                </div>

                <div className="text-xs text-bone-200 mb-3 font-mono">
                  {c.salaryRange}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {c.skills.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-bone-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <span className="text-[10px] text-bone-400 uppercase tracking-wider">
                    View roadmap
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-bone-400 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
