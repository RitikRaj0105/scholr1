import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { Activity, Brain, Target, Zap, TrendingUp, Clock } from 'lucide-react';

const focusData = [
  { day: 'Mon', minutes: 142 },
  { day: 'Tue', minutes: 198 },
  { day: 'Wed', minutes: 165 },
  { day: 'Thu', minutes: 231 },
  { day: 'Fri', minutes: 287 },
  { day: 'Sat', minutes: 312 },
  { day: 'Sun', minutes: 268 },
];

const masteryData = [{ name: 'mastery', value: 84, fill: '#7c3aed' }];

export const DashboardPreview = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [12, 0, -8]);

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-bone-400 text-xs uppercase tracking-[0.2em] mb-6">
            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
            <span>Live cockpit</span>
          </div>
          <h2 className="font-display text-5xl md:text-display-md text-bone-50 leading-[0.95] mb-6">
            Your productivity,{' '}
            <span className="italic text-bone-300">visualized.</span>
          </h2>
          <p className="text-bone-300/80 text-lg max-w-2xl mx-auto">
            Real-time analytics, AI-driven recommendations, and the kind of
            telemetry usually reserved for jet cockpits — built for your study
            life.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          style={{ y, rotateX, perspective: 1200 }}
          className="relative"
        >
          <div className="relative rounded-3xl border border-white/10 bg-ink-900/60 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-violet-500/10">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-ink-950/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-bone-400/20" />
                <div className="w-3 h-3 rounded-full bg-bone-400/20" />
                <div className="w-3 h-3 rounded-full bg-bone-400/20" />
              </div>
              <div className="flex-1 text-center text-xs text-bone-400/60 font-mono">
                scholr.app/dashboard
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard grid */}
            <div className="p-6 grid grid-cols-12 gap-4">
              {/* Top stats row */}
              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="Focus today"
                value="4h 23m"
                delta="+18%"
                accent="violet"
                delay={0}
              />
              <StatCard
                icon={<Target className="w-4 h-4" />}
                label="Tests aced"
                value="12"
                delta="+3"
                accent="cyan"
                delay={0.05}
              />
              <StatCard
                icon={<Zap className="w-4 h-4" />}
                label="Streak"
                value="47d"
                delta="🔥"
                accent="magenta"
                delay={0.1}
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Mastery"
                value="84%"
                delta="+6%"
                accent="violet"
                delay={0.15}
              />

              {/* Focus chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="col-span-12 md:col-span-8 rounded-2xl border border-white/10 bg-ink-950/40 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-bone-400/70 uppercase tracking-wider mb-1">
                      Weekly focus
                    </div>
                    <div className="font-display text-2xl text-bone-50">
                      27h 23m
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-cyan-400">
                    <Activity className="w-3 h-3" />
                    <span>+24% vs last week</span>
                  </div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={focusData}>
                      <defs>
                        <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#a3a39e', fontSize: 11 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: '#0f0f15',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: '#f3efe7' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fill="url(#focusGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Mastery radial */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="col-span-12 md:col-span-4 rounded-2xl border border-white/10 bg-ink-950/40 p-5 flex flex-col"
              >
                <div className="text-xs text-bone-400/70 uppercase tracking-wider mb-1">
                  Course mastery
                </div>
                <div className="font-display text-2xl text-bone-50 mb-2">
                  Calculus II
                </div>
                <div className="flex-1 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height={160}>
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      data={masteryData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        tick={false}
                      />
                      <RadialBar
                        background={{ fill: 'rgba(255,255,255,0.05)' }}
                        dataKey="value"
                        cornerRadius={20}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-display text-3xl text-bone-50">84%</div>
                    <div className="text-xs text-bone-400/70">mastery</div>
                  </div>
                </div>
              </motion.div>

              {/* AI insights card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="col-span-12 md:col-span-7 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-violet-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-violet-300 uppercase tracking-wider mb-1">
                      AI Mentor · Just now
                    </div>
                    <p className="text-bone-100 text-sm leading-relaxed mb-3">
                      Your retention drops 23% after 90 minutes. I've slotted a
                      5-min walk at 4:15 and queued the Series Convergence
                      review you postponed Tuesday.
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-200 text-xs hover:bg-violet-500/30 transition-colors">
                        Accept plan
                      </button>
                      <button className="px-3 py-1.5 rounded-lg border border-white/10 text-bone-300 text-xs hover:bg-white/5 transition-colors">
                        Ask why
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Upcoming exam */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="col-span-12 md:col-span-5 rounded-2xl border border-white/10 bg-ink-950/40 p-5"
              >
                <div className="text-xs text-bone-400/70 uppercase tracking-wider mb-3">
                  Next up
                </div>
                <div className="space-y-3">
                  <ExamRow
                    title="Linear Algebra Midterm"
                    when="Tue · 14:00"
                    readiness={92}
                  />
                  <ExamRow
                    title="DSA Practice · Trees"
                    when="Wed · 19:30"
                    readiness={71}
                  />
                  <ExamRow
                    title="Physics Quiz 4"
                    when="Fri · 11:00"
                    readiness={58}
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Reflection */}
          <div className="absolute inset-x-12 -bottom-20 h-40 bg-gradient-to-b from-violet-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  delta,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  accent: 'violet' | 'cyan' | 'magenta';
  delay: number;
}) => {
  const accentMap = {
    violet: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    cyan: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    magenta: 'text-magenta-300 bg-magenta-500/10 border-magenta-500/20',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="col-span-6 md:col-span-3 rounded-2xl border border-white/10 bg-ink-950/40 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${accentMap[accent]}`}
        >
          {icon}
        </div>
        <div className="text-xs text-bone-400/60">{delta}</div>
      </div>
      <div className="font-display text-2xl text-bone-50 leading-none mb-1">
        {value}
      </div>
      <div className="text-xs text-bone-400/70 uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
};

const ExamRow = ({
  title,
  when,
  readiness,
}: {
  title: string;
  when: string;
  readiness: number;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <div className="text-sm text-bone-100 truncate">{title}</div>
      <div className="text-xs text-bone-400/70">{when}</div>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{ width: `${readiness}%` }}
        />
      </div>
      <span className="text-xs text-bone-300 w-8 text-right">{readiness}%</span>
    </div>
  </div>
);
