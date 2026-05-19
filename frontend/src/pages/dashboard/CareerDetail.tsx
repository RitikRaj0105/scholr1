import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Target,
  IndianRupee,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

interface SkillAssessment {
  name: string;
  level: number;
  status: 'strong' | 'developing' | 'gap';
}

interface CareerDetail {
  slug: string;
  title: string;
  icon: string;
  category: string;
  description: string;
  salaryRange: string;
  growthRate: string;
  demandLevel: 'high' | 'medium' | 'low';
  skills: string[];
  education: string[];
  roadmap: string[];
  matchScore: number;
  skillAssessment: SkillAssessment[];
}

const STATUS_CONFIG = {
  strong: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    label: 'Strong',
    barColor: 'bg-emerald-500',
  },
  developing: {
    icon: Circle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    label: 'Developing',
    barColor: 'bg-amber-500',
  },
  gap: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Gap',
    barColor: 'bg-red-500',
  },
};

export default function CareerDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: career, isLoading, error } = useQuery<CareerDetail>({
    queryKey: ['career', slug],
    queryFn: async () =>
      (await api.get(`/career/profiles/${slug}`)).data.career,
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-bone-400 text-sm">Loading career…</div>
      </DashboardLayout>
    );
  }

  if (error || !career) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Link
            to="/dashboard/career"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to careers
          </Link>
          <p className="mt-6 text-sm text-bone-300">Career not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const skillsStrong = career.skillAssessment.filter((s) => s.status === 'strong').length;
  const skillsDeveloping = career.skillAssessment.filter((s) => s.status === 'developing').length;
  const skillsGap = career.skillAssessment.filter((s) => s.status === 'gap').length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          <Link
            to="/dashboard/career"
            className="inline-flex items-center gap-2 text-bone-400 hover:text-violet-400 text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All careers
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-6 mb-5"
        >
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-ink-900 border border-violet-500/25 flex items-center justify-center text-4xl flex-shrink-0">
              {career.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-violet-400 font-medium uppercase tracking-wider mb-1">
                {career.category} · {career.demandLevel} demand
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-bone-50 mb-3">
                {career.title}
              </h1>
              <p className="text-sm text-bone-200 leading-relaxed max-w-3xl">
                {career.description}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-4xl font-bold text-violet-400 leading-none">
                {career.matchScore}%
              </div>
              <div className="text-[10px] text-bone-400 uppercase tracking-wider mt-1 font-medium">
                Your match
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stat row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <StatCard
            icon={<IndianRupee className="w-4 h-4" />}
            label="Salary range"
            value={career.salaryRange}
            accent="emerald"
            delay={0.1}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Industry growth"
            value={career.growthRate}
            accent="cyan"
            delay={0.15}
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="Demand"
            value={career.demandLevel.toUpperCase()}
            accent={career.demandLevel === 'high' ? 'emerald' : 'amber'}
            delay={0.2}
          />
        </div>

        {/* Two-column */}
        <div className="grid grid-cols-12 gap-4">
          {/* Skill gap analysis */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="col-span-12 lg:col-span-7 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5"
          >
            <div className="mb-4">
              <h3 className="font-display text-lg text-bone-50 mb-1">
                Your skill gap
              </h3>
              <p className="text-xs text-bone-400">
                Based on your test scores and coding submissions
              </p>
            </div>

            {/* Quick summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <SkillSummary
                label="Strong"
                count={skillsStrong}
                color="text-emerald-400"
                bg="bg-emerald-500/10 border-emerald-500/15"
              />
              <SkillSummary
                label="Developing"
                count={skillsDeveloping}
                color="text-amber-400"
                bg="bg-amber-500/10 border-amber-500/15"
              />
              <SkillSummary
                label="Gaps"
                count={skillsGap}
                color="text-red-400"
                bg="bg-red-500/10 border-red-500/15"
              />
            </div>

            <div className="space-y-2.5">
              {career.skillAssessment.map((skill, i) => {
                const cfg = STATUS_CONFIG[skill.status];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.3 + i * 0.05 }}
                    className={`p-3 rounded-lg border ${cfg.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
                      <span className="text-sm text-bone-100 flex-1 truncate">
                        {skill.name}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-ink-950 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.05, ease: 'easeOut' }}
                        className={`h-full ${cfg.barColor}`}
                      />
                    </div>
                    <div className="text-[10px] text-bone-400 font-mono mt-1 text-right">
                      {skill.level}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* Education paths */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display text-base text-bone-50">
                  Education paths
                </h3>
              </div>
              <ul className="space-y-2">
                {career.education.map((e, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.35 + i * 0.04 }}
                    className="flex items-start gap-2 text-xs text-bone-200"
                  >
                    <span className="text-cyan-400 mt-0.5">→</span>
                    <span>{e}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Required skills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5"
            >
              <h3 className="font-display text-base text-bone-50 mb-3">
                All required skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {career.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-5 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5"
        >
          <div className="mb-4">
            <h3 className="font-display text-lg text-bone-50 mb-1">
              Recommended roadmap
            </h3>
            <p className="text-xs text-bone-400">
              Step-by-step plan to reach this career
            </p>
          </div>
          <div className="space-y-3">
            {career.roadmap.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.45 + i * 0.06 }}
                className="flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-mono text-xs text-violet-400 font-semibold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-bone-200 leading-relaxed">{step}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="mt-5 text-center text-xs text-bone-400">
          Keep working on your weak skills above. Your match score will go up as you improve.
        </div>
      </div>
    </DashboardLayout>
  );
}

const StatCard = ({
  icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'emerald' | 'cyan' | 'amber' | 'violet';
  delay: number;
}) => {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4 flex items-center gap-3"
    >
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${colors[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-bone-400 uppercase tracking-wider font-medium mb-0.5">
          {label}
        </p>
        <p className="text-sm text-bone-50 font-mono truncate">{value}</p>
      </div>
    </motion.div>
  );
};

const SkillSummary = ({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) => (
  <div className={`rounded-lg border p-3 text-center ${bg}`}>
    <div className={`font-mono text-2xl font-bold leading-none ${color}`}>
      {count}
    </div>
    <div className={`text-[10px] uppercase tracking-wider mt-1.5 font-medium ${color}`}>
      {label}
    </div>
  </div>
);
