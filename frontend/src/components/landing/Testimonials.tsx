import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      "I went from 62% to 91% in two semesters. Scholr's AI mentor caught patterns in my study habits I'd been blind to for years.",
    author: 'Ananya Krishnan',
    role: 'BTech CSE · IIIT Hyderabad',
    accent: 'violet',
  },
  {
    quote:
      "Focus Mode is the only productivity tool my students actually keep using past week two. Streak data feeds straight into parent dashboards.",
    author: 'Dr. Vikram Sethi',
    role: 'Vice Principal · DPS Bangalore',
    accent: 'cyan',
  },
  {
    quote:
      "We ran our entire placement pipeline through Scholr this season. Resume scoring + coding rounds + analytics — 47 hours saved per recruiter.",
    author: 'Priya Menon',
    role: 'Head of Hiring · Razorpay',
    accent: 'magenta',
  },
  {
    quote:
      "Asked it to generate a JEE mock at 11pm. Got 90 questions with worked solutions. The explanations are better than half my textbooks.",
    author: 'Rohan Agarwal',
    role: 'JEE Aspirant · Class XII',
    accent: 'violet',
  },
  {
    quote:
      "The mood log + focus correlation surfaced that I'm 40% less productive after poor sleep. That single insight reshaped my whole week.",
    author: 'Kavya Reddy',
    role: 'MBBS · CMC Vellore',
    accent: 'cyan',
  },
  {
    quote:
      "Our institution rolled out Scholr to 2,400 students. Engagement metrics outperformed every LMS we'd trialled in the last six years.",
    author: 'Prof. Aditya Rao',
    role: 'Dean of Academics · BITS Pilani',
    accent: 'magenta',
  },
];

const accentMap = {
  violet: 'border-violet-500/20 hover:border-violet-500/40 hover:shadow-glow-violet',
  cyan: 'border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-glow-cyan',
  magenta: 'border-magenta-500/20 hover:border-magenta-500/40',
};

const quoteColor = {
  violet: 'text-violet-400/30',
  cyan: 'text-cyan-400/30',
  magenta: 'text-magenta-400/30',
};

export const Testimonials = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-bone-400 text-xs uppercase tracking-[0.2em] mb-6">
            <span className="w-1 h-1 rounded-full bg-violet-400" />
            <span>Trusted by 2.4M students · 180k institutions</span>
          </div>
          <h2 className="font-display text-5xl md:text-display-md text-bone-50 leading-[0.95]">
            Built for the{' '}
            <span className="italic text-bone-300">
              top of the curve.
            </span>
          </h2>
        </motion.div>

        {/* Logo strip */}
        <div className="mb-16 py-8 border-y border-white/5">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-bone-400/40 text-sm uppercase tracking-[0.2em]">
            <span>IIT Bombay</span>
            <span className="w-1 h-1 rounded-full bg-bone-400/20" />
            <span>BITS Pilani</span>
            <span className="w-1 h-1 rounded-full bg-bone-400/20" />
            <span>NIT Trichy</span>
            <span className="w-1 h-1 rounded-full bg-bone-400/20" />
            <span>IIIT Hyderabad</span>
            <span className="w-1 h-1 rounded-full bg-bone-400/20" />
            <span>Ashoka University</span>
            <span className="w-1 h-1 rounded-full bg-bone-400/20" />
            <span>VIT Vellore</span>
          </div>
        </div>

        {/* Testimonial grid — staggered masonry feel */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
              className={`group relative rounded-3xl border ${accentMap[t.accent as keyof typeof accentMap]} bg-ink-900/40 backdrop-blur-sm p-7 transition-all duration-500 hover:-translate-y-1 ${
                i === 1 || i === 4 ? 'md:translate-y-8' : ''
              }`}
            >
              <Quote
                className={`absolute top-6 right-6 w-8 h-8 ${quoteColor[t.accent as keyof typeof quoteColor]}`}
                strokeWidth={1}
              />
              <p className="text-bone-100/90 text-base leading-relaxed mb-6 relative z-10">
                {t.quote}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                    t.accent === 'violet'
                      ? 'from-violet-500 to-violet-700'
                      : t.accent === 'cyan'
                      ? 'from-cyan-400 to-cyan-600'
                      : 'from-magenta-500 to-magenta-700'
                  } flex items-center justify-center text-white font-display text-sm`}
                >
                  {t.author
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <div className="text-sm text-bone-50 font-medium">
                    {t.author}
                  </div>
                  <div className="text-xs text-bone-400/70">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
