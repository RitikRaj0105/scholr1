import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Plus,
  BookOpen,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Award,
  Brain,
  Search,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

interface UserAttempt {
  score: number | null;
  submittedAt: string | null;
}

interface ExamSummary {
  id: string;
  title: string;
  type: string;
  durationMin: number;
  totalMarks: number;
  generatedByAI: boolean;
  createdAt: string;
  _count: { questions: number; attempts: number };
  attempts: UserAttempt[];
}

interface Stats {
  totalExams: number;
  examsAttempted: number;
  totalAttempts: number;
  averagePercentage: number;
  bestPercentage: number;
  trend: number;
  timeline: { date: string; score: number; title: string }[];
  masteryByType: { type: string; percentage: number; count: number }[];
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type FilterTab = 'all' | 'taken' | 'new';

export default function Tests() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: '',
    count: 10,
    difficulty: 'MEDIUM' as Difficulty,
    durationMin: 30,
  });

  const { data: exams = [], isLoading } = useQuery<ExamSummary[]>({
    queryKey: ['exams'],
    queryFn: async () => (await api.get('/exams')).data.exams,
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['exam-stats'],
    queryFn: async () => (await api.get('/exams/stats')).data.stats,
  });

  const generate = useMutation({
    mutationFn: async () =>
      (
        await api.post('/exams/generate', {
          subject: form.subject,
          difficulty: form.difficulty,
          count: form.count,
          type: 'MCQ',
          durationMin: form.durationMin,
          examType: 'CUSTOM',
        })
      ).data.exam,
    onSuccess: (exam: { id: string }) => {
      qc.invalidateQueries({ queryKey: ['exams'] });
      qc.invalidateQueries({ queryKey: ['exam-stats'] });
      setOpen(false);
      navigate(`/dashboard/tests/${exam.id}`);
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.error ||
          'Could not generate test. Make sure your AI provider is running.'
      );
    },
  });

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      const taken = e.attempts.length > 0;
      if (tab === 'taken' && !taken) return false;
      if (tab === 'new' && taken) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [exams, tab, search]);

  const insight = useMemo(() => {
    if (!stats || stats.totalAttempts === 0) return null;
    if (stats.trend > 5) {
      return {
        tone: 'cyan' as const,
        text: `You're up ${stats.trend}% over your previous five attempts. Momentum is real — keep pushing on the same difficulty band.`,
      };
    }
    if (stats.trend < -5) {
      return {
        tone: 'magenta' as const,
        text: `Recent scores dipped ${Math.abs(stats.trend)}%. Worth slowing down — try an easier difficulty or revisit weak topics from your review.`,
      };
    }
    if (stats.averagePercentage >= 80) {
      return {
        tone: 'violet' as const,
        text: `You're holding ${stats.averagePercentage}% average. Bump difficulty up to HARD — comfort kills growth.`,
      };
    }
    return {
      tone: 'violet' as const,
      text: `Solid baseline at ${stats.averagePercentage}%. Keep stacking attempts — accuracy compounds.`,
    };
  }, [stats]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.subject.trim()) {
      setError('Pick a subject first.');
      return;
    }
    generate.mutate();
  };

  const hasData = stats && stats.totalAttempts > 0;

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
            <div className="text-sm text-bone-400 mb-1">Tests</div>
            <h1 className="font-display text-4xl text-bone-50">
              Generate.{' '}
              <span className="italic text-bone-300">Take. Master.</span>
            </h1>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="px-5 py-2.5 rounded-full bg-bone-50 text-ink-950 hover:bg-white transition-colors text-sm font-medium flex items-center gap-2 shadow-glow-violet"
          >
            <Plus className="w-4 h-4" />
            Generate test
          </button>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<BookOpen className="w-4 h-4" />}
            label="Tests taken"
            value={stats?.totalAttempts ?? 0}
            sublabel={`across ${stats?.examsAttempted ?? 0} unique`}
            accent="violet"
            delay={0}
          />
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Avg score"
            value={`${stats?.averagePercentage ?? 0}%`}
            sublabel={
              stats && stats.trend !== 0
                ? `${stats.trend > 0 ? '+' : ''}${stats.trend}% vs prior`
                : 'no trend yet'
            }
            trend={stats?.trend}
            accent="cyan"
            delay={0.05}
          />
          <StatCard
            icon={<Award className="w-4 h-4" />}
            label="Best score"
            value={`${stats?.bestPercentage ?? 0}%`}
            sublabel="personal record"
            accent="magenta"
            delay={0.1}
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="In library"
            value={stats?.totalExams ?? exams.length}
            sublabel={`${exams.filter((e) => e.attempts.length === 0).length} unattempted`}
            accent="violet"
            delay={0.15}
          />
        </div>

        {/* Performance + AI insight */}
        {hasData && (
          <div className="grid grid-cols-12 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="col-span-12 lg:col-span-8 rounded-2xl border border-white/10 bg-ink-900/40 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs text-bone-400 uppercase tracking-wider mb-1">
                    Performance trend
                  </div>
                  <div className="font-display text-2xl text-bone-50">
                    Last {stats.timeline.length} attempts
                  </div>
                </div>
                {stats.trend !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stats.trend > 0 ? 'text-cyan-300' : 'text-magenta-300'
                    }`}
                  >
                    {stats.trend > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(stats.trend)}%
                  </div>
                )}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.timeline}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a3a39e', fontSize: 11 }}
                      tickFormatter={(d) => {
                        if (!d) return '';
                        const date = new Date(d);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a3a39e', fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f0f15',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#f3efe7' }}
                      formatter={(value: number) => [`${value}%`, 'Score']}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className={`col-span-12 lg:col-span-4 rounded-2xl border p-6 flex flex-col ${
                insight?.tone === 'cyan'
                  ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent'
                  : insight?.tone === 'magenta'
                  ? 'border-magenta-500/30 bg-gradient-to-br from-magenta-500/10 to-transparent'
                  : 'border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain
                  className={`w-4 h-4 ${
                    insight?.tone === 'cyan'
                      ? 'text-cyan-300'
                      : insight?.tone === 'magenta'
                      ? 'text-magenta-300'
                      : 'text-violet-300'
                  }`}
                />
                <span
                  className={`text-xs uppercase tracking-wider ${
                    insight?.tone === 'cyan'
                      ? 'text-cyan-300'
                      : insight?.tone === 'magenta'
                      ? 'text-magenta-300'
                      : 'text-violet-300'
                  }`}
                >
                  Mentor insight
                </span>
              </div>
              <p className="text-bone-100 leading-relaxed flex-1">
                {insight?.text}
              </p>
              {stats.masteryByType.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-bone-400 mb-2">
                    Mastery by type
                  </div>
                  {stats.masteryByType.map((m) => (
                    <div key={m.type} className="flex items-center gap-2 text-xs">
                      <span className="text-bone-300 w-20 truncate">
                        {m.type}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${m.percentage}%` }}
                        />
                      </div>
                      <span className="text-bone-200 w-8 text-right tabular-nums">
                        {m.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Filter + search bar */}
        {exams.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="inline-flex p-1 rounded-full border border-white/10 bg-ink-900/60">
              {([
                { id: 'all', label: 'All' },
                { id: 'taken', label: 'Taken' },
                { id: 'new', label: 'New' },
              ] as { id: FilterTab; label: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-4 py-1.5 text-sm rounded-full transition-colors ${
                    tab === t.id ? 'text-ink-950' : 'text-bone-300'
                  }`}
                >
                  {tab === t.id && (
                    <motion.div
                      layoutId="tests-tab-bg"
                      className="absolute inset-0 bg-bone-50 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    {t.label}
                    {t.id === 'all' && ` · ${exams.length}`}
                    {t.id === 'taken' &&
                      ` · ${exams.filter((e) => e.attempts.length > 0).length}`}
                    {t.id === 'new' &&
                      ` · ${exams.filter((e) => e.attempts.length === 0).length}`}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tests…"
                className="pl-9 pr-4 py-2 bg-ink-900/60 border border-white/10 rounded-full text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50 w-56"
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && exams.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-ink-900/40 p-16 text-center"
          >
            <div className="inline-flex w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-violet-300" />
            </div>
            <h2 className="font-display text-3xl text-bone-50 mb-3">
              No tests yet.
            </h2>
            <p className="text-bone-300/80 max-w-md mx-auto mb-8">
              Generate your first AI-built test in seconds. Pick a subject, a
              difficulty, and let your mentor build it.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="px-5 py-2.5 rounded-full bg-bone-50 text-ink-950 hover:bg-white transition-colors text-sm font-medium inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate first test
            </button>
          </motion.div>
        )}

        {/* Filtered empty */}
        {exams.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-12 text-center text-bone-400">
            No tests match this filter.
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((exam, i) => {
              const lastAttempt = exam.attempts[0];
              const taken = !!lastAttempt;
              const lastPct =
                taken && exam.totalMarks > 0
                  ? Math.round(
                      ((lastAttempt.score || 0) / exam.totalMarks) * 100
                    )
                  : null;
              const bestPct =
                exam.attempts.length > 0
                  ? Math.max(
                      ...exam.attempts.map((a) =>
                        exam.totalMarks > 0
                          ? Math.round(((a.score || 0) / exam.totalMarks) * 100)
                          : 0
                      )
                    )
                  : null;

              return (
                <motion.button
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  onClick={() => navigate(`/dashboard/tests/${exam.id}`)}
                  className="text-left rounded-2xl border border-white/10 bg-ink-900/40 p-5 hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all group relative overflow-hidden"
                >
                  {/* Score ribbon */}
                  {bestPct !== null && (
                    <div className="absolute top-0 right-0">
                      <div
                        className={`px-3 py-1 text-[10px] uppercase tracking-wider font-medium ${
                          bestPct >= 70
                            ? 'bg-cyan-500/15 text-cyan-300 border-l border-b border-cyan-500/30'
                            : bestPct >= 50
                            ? 'bg-violet-500/15 text-violet-300 border-l border-b border-violet-500/30'
                            : 'bg-magenta-500/15 text-magenta-300 border-l border-b border-magenta-500/30'
                        } rounded-bl-xl`}
                      >
                        Best {bestPct}%
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">
                      {exam.type}
                    </span>
                    {exam.generatedByAI && (
                      <div className="flex items-center gap-1 text-[10px] text-cyan-300/70">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </div>
                    )}
                  </div>

                  <h3 className="font-display text-xl text-bone-50 mb-1 leading-tight pr-16">
                    {exam.title}
                  </h3>

                  {taken && lastPct !== null && (
                    <div className="mt-3 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-violet-300" />
                      <span className="text-xs text-bone-300">
                        Last attempt: {lastPct}%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-bone-400 pt-4 mt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span>{exam._count.questions} qs</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.durationMin}m
                      </span>
                      {exam.attempts.length > 0 && (
                        <span className="flex items-center gap-1 text-cyan-300/80">
                          <CheckCircle2 className="w-3 h-3" />
                          {exam.attempts.length}
                          {exam.attempts.length === 5 && '+'}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Generate modal */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900 p-8"
              >
                <div className="mb-6">
                  <div className="text-xs uppercase tracking-wider text-bone-400 mb-2">
                    AI test generation
                  </div>
                  <h2 className="font-display text-3xl text-bone-50">
                    Build a test.
                  </h2>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-bone-400 mb-2">
                      Subject / topic
                    </label>
                    <input
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      placeholder="e.g. Linear algebra, eigenvalues"
                      className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-xl text-bone-50 placeholder:text-bone-400/40 focus:outline-none focus:border-violet-500/50"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-bone-400 mb-2">
                        Questions
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={form.count}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            count: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-xl text-bone-50 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-bone-400 mb-2">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={form.durationMin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            durationMin: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-xl text-bone-50 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-bone-400 mb-2">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setForm({ ...form, difficulty: d })}
                          className={`py-3 rounded-xl text-sm transition-all ${
                            form.difficulty === d
                              ? 'bg-violet-500/20 border border-violet-500/50 text-violet-100'
                              : 'border border-white/10 text-bone-300 hover:border-white/20'
                          }`}
                        >
                          {d[0] + d.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-magenta-500/10 border border-magenta-500/30 text-magenta-200 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-bone-300 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generate.isPending}
                      className="flex-1 py-3 rounded-xl bg-bone-50 text-ink-950 font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {generate.isPending ? (
                        <>
                          <span className="w-4 h-4 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-bone-400/60 text-center pt-2">
                    AI generation can take 10–60 seconds with local models.
                    Don't close this window.
                  </p>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

// ─── Stat card subcomponent ─────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  sublabel,
  accent,
  trend,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  accent: 'violet' | 'cyan' | 'magenta';
  trend?: number;
  delay: number;
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
        {trend !== undefined && trend !== 0 && (
          <div
            className={`text-xs flex items-center gap-0.5 ${
              trend > 0 ? 'text-cyan-300' : 'text-magenta-300'
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
          </div>
        )}
      </div>
      <div className="font-display text-3xl text-bone-50 leading-none mb-2 tabular-nums">
        {value}
      </div>
      <div className="text-xs text-bone-400 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      {sublabel && (
        <div className="text-[11px] text-bone-400/60">{sublabel}</div>
      )}
    </motion.div>
  );
};
