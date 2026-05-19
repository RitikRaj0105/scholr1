import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#preview', label: 'Product' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const backdrop = useTransform(scrollY, [0, 80], [0, 0.7]);
  const border = useTransform(scrollY, [0, 80], [0, 0.06]);

  return (
    <motion.nav
      style={{
        backgroundColor: useTransform(backdrop, (v) => `rgba(10,10,16,${v})`),
        borderColor: useTransform(border, (v) => `rgba(255,255,255,${v})`),
      }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
        <Link to="/" className="group flex items-center gap-2">
          <Logo />
          <span className="font-display text-2xl tracking-tight">Scholr</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone-400 sm:inline">
            v0.1
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-4 py-2 text-sm text-bone-300 transition-colors hover:text-bone-100"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm text-bone-300 transition-colors hover:text-bone-100 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-bone-100 px-5 py-2.5 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03]"
          >
            Get started
            <span className="font-mono text-xs">→</span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" className="text-violet-400">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="4" fill="url(#logoGrad)" />
    </svg>
  );
}
