import { motion } from 'framer-motion';
import {
  Brain,
  Calendar,
  Focus,
  Users,
  FileQuestion,
  Compass,
  Heart,
  GraduationCap,
  Briefcase,
  Code,
  type LucideIcon,
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  span?: string; // tailwind col-span override for bento layout
  accent?: 'violet' | 'cyan' | 'magenta';
}

const features: Feature[] = [
  {
    icon: Brain,
    title: 'AI Mentor',
    body: 'A personal tutor that knows your gaps, your strengths, and what to drill next. Streams Socratic-style guidance, not just answers.',
    span: 'md:col-span-2',
    accent: 'violet',
  },
  {
    icon: Focus,
    title: 'Focus Mode',
    body: 'Pomodoro engine with real distraction blocking — Instagram, TikTok, YouTube, X — and weekly heatmaps that turn discipline into a ritual.',
    accent: 'cyan',
  },
  {
    icon: Calendar,
    title: 'Adaptive Study Plans',
    body: 'AI builds your week from your syllabus, exam dates, and energy patterns. Adjusts when life doesn’t.',
  },
  {
    icon: FileQuestion,
    title: 'Universal Test Engine',
    body: 'Generate MCQs, descriptive sets, coding rounds, and mock exams for any subject — school, college, JEE, GATE, SAT, CAT.',
    span: 'md:col-span-2',
    accent: 'magenta',
  },
  {
    icon: Code,
    title: 'Coding Studio',
    body: 'In-browser editor, hidden test cases, runtime telemetry, and contests with live leaderboards.',
  },
  {
    icon: Compass,
    title: 'Career Compass',
    body: 'Maps your skills to real roles. Names the companies, the courses, the projects — phase by phase.',
  },
  {
    icon: Users,
    title: 'Social Productivity',
    body: 'Co-work rooms, accountability circles, peer streaks. The dopamine of group study, without the noise.',
  },
  {
    icon: Heart,
    title: 'Wellness',
    body: 'Mood logs, breathing rituals, sleep hygiene nudges. Not therapy — but a friend that checks in.',
  },
  {
    icon: GraduationCap,
    title: 'Classroom + LMS',
    body: 'Teachers, parents, admins, and students on one rail. Assignments, attendance, grading, live chat.',
  },
  {
    icon: Briefcase,
    title: 'Jobs & Placements',
    body: 'AI resume builder, recruiter dashboards, hiring tests, mock interviews. Your path from student to hired.',
    span: 'md:col-span-2',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <SectionHeader
          eyebrow="The product"
          title={
            <>
              Ten surfaces.<br />
              <span className="italic text-bone-300">One operating system.</span>
            </>
          }
          subtitle="Every tool a student needs — focus, learning, testing, career, wellness — woven through a single AI that remembers everything you've worked on."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  const accentMap = {
    violet: 'group-hover:text-violet-300',
    cyan: 'group-hover:text-cyan-300',
    magenta: 'group-hover:text-magenta-500',
    undefined: 'group-hover:text-bone-100',
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-900/60 p-7 backdrop-blur-xl transition-colors hover:border-white/15 ${feature.span ?? ''}`}
    >
      {/* Accent glow on hover */}
      <div
        className={`pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100`}
        style={{
          background:
            feature.accent === 'violet'
              ? 'radial-gradient(circle at 30% 0%, rgba(124,58,237,0.25), transparent 60%)'
              : feature.accent === 'cyan'
                ? 'radial-gradient(circle at 30% 0%, rgba(34,211,238,0.22), transparent 60%)'
                : feature.accent === 'magenta'
                  ? 'radial-gradient(circle at 30% 0%, rgba(225,29,106,0.18), transparent 60%)'
                  : 'radial-gradient(circle at 30% 0%, rgba(255,255,255,0.08), transparent 60%)',
        }}
      />

      <Icon
        className={`mb-6 transition-colors duration-500 ${accentMap[feature.accent ?? 'undefined']} text-bone-400`}
        size={28}
        strokeWidth={1.5}
      />
      <h3 className="mb-3 font-display text-2xl tracking-tight text-bone-100">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-bone-300">{feature.body}</p>

      {/* Hairline accent at top */}
      <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
