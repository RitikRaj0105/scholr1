import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AuthShellProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const AuthShell = ({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) => {
  return (
    <div className="min-h-screen bg-ink-950 text-bone-50 grid lg:grid-cols-2 relative overflow-hidden">
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none bg-grain opacity-[0.02] z-50 mix-blend-soft-light" />

      {/* Left — form */}
      <div className="relative flex flex-col px-8 lg:px-16 py-10 lg:py-16">
        <Link to="/" className="inline-flex items-center gap-2 group w-fit">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="auth-logo-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" stroke="url(#auth-logo-grad)" strokeWidth="2" />
            <circle cx="16" cy="16" r="6" fill="url(#auth-logo-grad)" />
          </svg>
          <span className="font-display text-xl text-bone-50 group-hover:text-bone-200 transition-colors">
            Scholr
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-12"
        >
          <div className="text-xs uppercase tracking-[0.25em] text-bone-400 mb-4">
            {eyebrow}
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-bone-50 leading-[1.05] mb-3">
            {title}
          </h1>
          <p className="text-bone-300/80 text-base mb-10">{subtitle}</p>

          {children}

          <div className="mt-8 text-sm text-bone-400">{footer}</div>
        </motion.div>

        <div className="text-xs text-bone-400/60 flex items-center gap-4">
          <span>© 2026 Scholr</span>
          <Link to="/" className="hover:text-bone-300 transition-colors">
            ← Back home
          </Link>
        </div>
      </div>

      {/* Right — aurora panel */}
      <div className="relative hidden lg:block overflow-hidden bg-gradient-to-br from-ink-900 to-ink-950">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/30 blur-[100px] rounded-full animate-float" />
          <div
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-400/20 blur-[100px] rounded-full animate-float"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-magenta-500/15 blur-[80px] rounded-full animate-float"
            style={{ animationDelay: '4s' }}
          />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(243,239,231,1) 1px, transparent 1px), linear-gradient(90deg, rgba(243,239,231,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Pull quote */}
        <div className="relative h-full flex items-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-md"
          >
            <div className="text-[10rem] leading-none font-display text-bone-50/10 mb-[-3rem] select-none">
              "
            </div>
            <p className="font-display text-2xl text-bone-100 italic leading-snug mb-6">
              I went from 62% to 91% in two semesters. Scholr's AI mentor
              caught patterns I'd been blind to for years.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-display text-sm">
                AK
              </div>
              <div>
                <div className="text-sm text-bone-50">Ananya Krishnan</div>
                <div className="text-xs text-bone-400">
                  BTech CSE · IIIT Hyderabad
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const AuthInput = (
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }
) => {
  const { label, ...rest } = props;
  return (
    <label className="block mb-4">
      <span className="block text-xs uppercase tracking-wider text-bone-400 mb-2">
        {label}
      </span>
      <input
        {...rest}
        className="w-full px-4 py-3 bg-ink-900/60 backdrop-blur-sm border border-white/10 rounded-xl text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/60 focus:bg-ink-900/80 transition-all"
      />
    </label>
  );
};

export const AuthButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) => (
  <button
    {...props}
    className="w-full py-3 bg-bone-50 text-ink-950 rounded-xl font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  />
);
