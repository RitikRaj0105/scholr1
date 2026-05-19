import { motion } from 'framer-motion';
import { ArrowUpRight, Github, Twitter, Linkedin, Send } from 'lucide-react';
import { useState } from 'react';

const linkGroups = [
  {
    title: 'Product',
    links: [
      { label: 'AI Mentor', href: '#' },
      { label: 'Focus Mode', href: '#' },
      { label: 'Test Engine', href: '#' },
      { label: 'Coding Studio', href: '#' },
      { label: 'Career Compass', href: '#' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'For',
    links: [
      { label: 'Students', href: '#' },
      { label: 'Teachers', href: '#' },
      { label: 'Schools', href: '#' },
      { label: 'Colleges', href: '#' },
      { label: 'Recruiters', href: '#' },
      { label: 'Parents', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Manifesto', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Brand', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Help center', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
];

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <footer className="relative pt-32 pb-12 overflow-hidden border-t border-white/5">
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-tr from-violet-500/20 via-magenta-500/10 to-cyan-400/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute inset-0 bg-grain opacity-[0.015]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Newsletter hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24 max-w-4xl"
        >
          <h2 className="font-display text-5xl md:text-7xl text-bone-50 leading-[0.9] mb-8">
            Build your{' '}
            <span className="italic text-bone-300">edge.</span>
            <br />
            One week at a time.
          </h2>
          <p className="text-bone-300/80 text-lg mb-10 max-w-2xl">
            The Scholr dispatch — one email, every Sunday. Productivity
            research, study system breakdowns, and what we're shipping next.
            No fluff. Unsubscribe with one click.
          </p>

          <form
            onSubmit={onSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-5 py-4 bg-ink-900/60 backdrop-blur-sm border border-white/10 rounded-full text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50 focus:bg-ink-900/80 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-4 bg-bone-50 text-ink-950 rounded-full font-medium hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              {submitted ? (
                <span>Subscribed ✓</span>
              ) : (
                <>
                  <span>Subscribe</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Link grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16 pb-16 border-b border-white/5">
          {/* Logo column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="footer-logo-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="14" stroke="url(#footer-logo-grad)" strokeWidth="2" />
                <circle cx="16" cy="16" r="6" fill="url(#footer-logo-grad)" />
              </svg>
              <span className="font-display text-xl text-bone-50">Scholr</span>
            </div>
            <p className="text-bone-400/70 text-sm leading-relaxed mb-6">
              The AI operating system for student success.
            </p>
            <div className="flex gap-3">
              <SocialLink href="#" icon={<Twitter className="w-4 h-4" />} />
              <SocialLink href="#" icon={<Github className="w-4 h-4" />} />
              <SocialLink href="#" icon={<Linkedin className="w-4 h-4" />} />
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-bone-400 text-xs uppercase tracking-[0.2em] mb-4">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-bone-200/80 hover:text-bone-50 text-sm transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-bone-400/60 text-xs">
            © 2026 Scholr Technologies Pvt. Ltd. · Bengaluru · All rights
            reserved.
          </div>
          <div className="flex items-center gap-6 text-bone-400/60 text-xs">
            <a href="#" className="hover:text-bone-200 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-bone-200 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-bone-200 transition-colors">
              Security
            </a>
            <a href="#" className="hover:text-bone-200 transition-colors">
              DPA
            </a>
          </div>
        </div>

        {/* Giant brand wordmark */}
        <div className="mt-20 -mb-8 overflow-hidden">
          <div className="font-display italic text-[18vw] leading-none text-bone-50/[0.03] text-center select-none pointer-events-none">
            Scholr
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({
  href,
  icon,
}: {
  href: string;
  icon: React.ReactNode;
}) => (
  <a
    href={href}
    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-bone-300 hover:text-bone-50 hover:border-white/30 hover:bg-white/5 transition-all"
  >
    {icon}
  </a>
);
