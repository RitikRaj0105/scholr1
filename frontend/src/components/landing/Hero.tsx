import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AIOrb } from '@/components/three/AIOrb';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ArrowRight, Play } from 'lucide-react';

/**
 * The hero is deliberately asymmetric. The serif headline breaks the column grid
 * and overlaps the orb's halo on the right. The eyebrow + stats column sits
 * underneath as a horizontal data strip — like the masthead of a journal.
 */
export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-32">
      {/* Aurora gradient layer */}
      <div className="aurora opacity-90" />

      {/* Faint grid that fades into the page */}
      <div className="absolute inset-0 bg-grid-fade opacity-30" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 pb-24 sm:px-8 lg:px-10">
        {/* ===== Left column — headline + copy ===== */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone-300">
              Now in private beta · invite-only
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[3.5rem] leading-[1.02] tracking-[-0.02em] text-bone-100 sm:text-[5rem] md:text-[6.5rem] lg:text-[7.5rem]"
          >
            Your AI
            <br />
            <span className="relative inline-block italic">
              operating system
              <svg
                className="absolute -bottom-2 left-0 w-full text-violet-400/60"
                viewBox="0 0 400 20"
                preserveAspectRatio="none"
                aria-hidden
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.9, duration: 1.2, ease: 'easeOut' }}
                  d="M2 12 Q 100 4, 200 10 T 398 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <br />
            for student
            <br />
            <span className="text-gradient">success.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-10 max-w-xl text-lg leading-relaxed text-bone-300"
          >
            Study smarter. Eliminate distractions. Master your future. Scholr is the AI
            companion that thinks, plans, and grows with you — from your first focus
            sprint to your first job offer.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link to="/signup">
              <MagneticButton variant="primary" className="px-8 py-4 text-base">
                Start free
                <ArrowRight size={18} strokeWidth={2.2} />
              </MagneticButton>
            </Link>
            <MagneticButton variant="ghost" className="px-7 py-4 text-base">
              <Play size={16} strokeWidth={2.2} />
              Watch the film
            </MagneticButton>
          </motion.div>

          {/* Mini stats strip — editorial masthead style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-20 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/10 pt-8"
          >
            <Stat n="2.4M" label="Focus minutes" />
            <Stat n="180k" label="Students learning" />
            <Stat n="98%" label="Streak retention" />
          </motion.div>
        </div>

        {/* ===== Right column — the orb ===== */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-5">
          <div className="sticky top-32 -mr-10 lg:-mr-20">
            <div className="relative aspect-square w-full">
              {/* Soft glow disc behind the orb */}
              <div className="absolute inset-10 animate-pulse-glow rounded-full bg-violet-600/30 blur-3xl" />
              <AIOrb className="absolute inset-0" />

              {/* Floating telemetry tags */}
              <FloatingTag
                className="left-2 top-12"
                delay={1.1}
                label="model"
                value="scholr-1"
              />
              <FloatingTag
                className="right-4 top-1/3"
                delay={1.3}
                label="latency"
                value="142ms"
              />
              <FloatingTag
                className="bottom-12 left-1/4"
                delay={1.5}
                label="context"
                value="study · math"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl tracking-tight text-bone-100 sm:text-4xl">{n}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bone-400">
        {label}
      </div>
    </div>
  );
}

function FloatingTag({
  className,
  delay,
  label,
  value,
}: {
  className: string;
  delay: number;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${className} flex animate-float items-center gap-2 rounded-full border border-white/10 bg-ink-900/80 px-3 py-1.5 backdrop-blur-xl`}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-bone-400">
        {label}
      </span>
      <span className="font-mono text-[11px] text-bone-100">{value}</span>
    </motion.div>
  );
}
