import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Code2,
  Search,
  CheckCircle2,
  Circle,
  Activity,
  Target,
  Trophy,
  Server,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags: string[];
  submissions: { verdict: string }[];
  _count: { submissions: number };
}

interface CodeStats {
  totalProblems: number;
  solvedCount: number;
  totalSubmissions: number;
  acceptedCount: number;
  byDifficulty: Record<string, { solved: number; total: number }>;
}

interface HealthCheck {
  ok: boolean;
  judge0: string;
}

type Difficulty = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export default function Code() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>('ALL');
  const [search, setSearch] = useState('');

  const { data: problems = [], isLoading } = useQuery<ProblemSummary[]>({
    queryKey: ['code-problems'],
    queryFn: async () => (await api.get('/code/problems')).data.problems,
  });

  const { data: stats } = useQuery<CodeStats>({
    queryKey: ['code-stats'],
    queryFn: async () => (await api.get('/code/stats')).data.stats,
  });

  const { data: health } = useQuery<HealthCheck>({
    queryKey: ['judge0-health'],
    queryFn: async () => (await api.get('/code/health')).data,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (difficulty !== 'ALL' && p.difficulty !== difficulty) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [problems, difficulty, search]);

  const acceptanceRate =
    stats && stats.totalSubmissions > 0
      ? Math.round((stats.acceptedCount / stats.totalSubmissions) * 100)
      : 0;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex items-end justify-between gap-6 flex-wrap"
        >
          <div>
            <div className="text-sm text-bone-400 mb-1">Coding</div>
            <h1 className="font-display text-4xl text-bone-50">
              Write. <span className="italic text-bone-300">Run. Submit.</span>
            </h1>
          </div>
          <Judge0Status health={health} />
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Trophy className="w-4 h-4" />}
            label="Problems solved"
            value={`${stats?.solvedCount ?? 0} / ${stats?.totalProblems ?? 0}`}
            sublabel="unique problems"
            accent="violet"
            delay={0}
          />
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Submissions"
            value={stats?.totalSubmissions ?? 0}
            sublabel={`${stats?.acceptedCount ?? 0} accepted`}
            accent="cyan"
            delay={0.05}
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="Acceptance"
            value={`${acceptanceRate}%`}
            sublabel="across all submissions"
            accent="magenta"
            delay={0.1}
          />
          <StatCard
            icon={<Code2 className="w-4 h-4" />}
            label="By difficulty"
            value=""
            sublabel=""
            accent="violet"
            delay={0.15}
            children={
              stats && (
                <div className="space-y-1.5 mt-1">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => {
                    const v = stats.byDifficulty[d];
                    if (!v) return null;
                    return (
                      <div
                        key={d}
                        className="flex items-center justify-between text-xs"
                      >
                        <span
                          className={
                            d === 'EASY'
                              ? 'text-cyan-300'
                              : d === 'MEDIUM'
                              ? 'text-violet-300'
                              : 'text-magenta-300'
                          }
                        >
                          {d[0] + d.slice(1).toLowerCase()}
                        </span>
                        <span className="text-bone-200 tabular-nums">
                          {v.solved}/{v.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            }
          />
        </div>

        {/* Filter + search */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="inline-flex p-1 rounded-full border border-white/10 bg-ink-900/60">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`relative px-4 py-1.5 text-sm rounded-full transition-colors ${
                  difficulty === d ? 'text-ink-950' : 'text-bone-300'
                }`}
              >
                {difficulty === d && (
                  <motion.div
                    layoutId="code-diff-bg"
                    className="absolute inset-0 bg-bone-50 rounded-full"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative">
                  {d === 'ALL' ? 'All' : d[0] + d.slice(1).toLowerCase()}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems…"
              className="pl-9 pr-4 py-2 bg-ink-900/60 border border-white/10 rounded-full text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50 w-56"
            />
          </div>
        </div>

        {/* Empty / loading */}
        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-12 text-center text-bone-300">
            Loading problems…
          </div>
        )}

        {!isLoading && problems.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-ink-900/40 p-16 text-center">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 items-center justify-center mb-6">
              <Code2 className="w-7 h-7 text-violet-300" />
            </div>
            <h2 className="font-display text-3xl text-bone-50 mb-3">
              No problems yet.
            </h2>
            <p className="text-bone-300/80 max-w-md mx-auto mb-6">
              Run the seed script to populate starter problems:
            </p>
            <code className="px-4 py-2 rounded-lg bg-ink-950 border border-white/10 text-violet-300 font-mono text-sm">
              npx tsx prisma/seed-problems.ts
            </code>
          </div>
        )}

        {!isLoading && problems.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-12 text-center text-bone-400">
            No problems match this filter.
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-ink-900/40 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-bone-400">
                  <th className="px-5 py-3 text-left w-12"></th>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">
                    Tags
                  </th>
                  <th className="px-5 py-3 text-left w-32">Difficulty</th>
                  <th className="px-5 py-3 text-right w-32">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const accepted = p.submissions.some(
                    (s) => s.verdict === 'ACCEPTED'
                  );
                  const attempted = p._count.submissions > 0;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                      onClick={() => navigate(`/dashboard/code/${p.slug}`)}
                      className="border-b border-white/5 last:border-b-0 cursor-pointer hover:bg-violet-500/[0.04] transition-colors"
                    >
                      <td className="px-5 py-4">
                        {accepted ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                        ) : attempted ? (
                          <Circle className="w-4 h-4 text-magenta-300" />
                        ) : (
                          <Circle className="w-4 h-4 text-bone-400/30" />
                        )}
                      </td>
                      <td className="px-5 py-4 text-bone-50 font-medium">
                        {p.title}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {p.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-bone-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            p.difficulty === 'EASY'
                              ? 'bg-cyan-500/10 text-cyan-300'
                              : p.difficulty === 'MEDIUM'
                              ? 'bg-violet-500/10 text-violet-300'
                              : 'bg-magenta-500/10 text-magenta-300'
                          }`}
                        >
                          {p.difficulty[0] + p.difficulty.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-bone-400 text-sm tabular-nums">
                        {p._count.submissions}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const Judge0Status = ({ health }: { health?: HealthCheck }) => {
  if (!health)
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-bone-400 text-xs">
        <Server className="w-3 h-3" />
        Checking…
      </div>
    );
  if (health.ok)
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Judge0 online</span>
      </div>
    );
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-magenta-500/30 bg-magenta-500/10 text-magenta-300 text-xs">
      <AlertCircle className="w-3 h-3" />
      <span>Judge0 offline — start it via Docker</span>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  sublabel,
  accent,
  delay,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  accent: 'violet' | 'cyan' | 'magenta';
  delay: number;
  children?: React.ReactNode;
}) => {
  const colors = {
    violet: 'border-violet-500/20 text-violet-300 bg-violet-500/5',
    cyan: 'border-cyan-500/20 text-cyan-300 bg-cyan-500/5',
    magenta: 'border-magenta-500/20 text-magenta-300 bg-magenta-500/5',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-white/10 bg-ink-900/40 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[accent]}`}
        >
          {icon}
        </div>
      </div>
      {value !== '' && (
        <div className="font-display text-2xl text-bone-50 leading-none mb-2 tabular-nums">
          {value}
        </div>
      )}
      <div className="text-xs text-bone-400 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      {sublabel && (
        <div className="text-[11px] text-bone-400/60">{sublabel}</div>
      )}
      {children}
    </motion.div>
  );
};
