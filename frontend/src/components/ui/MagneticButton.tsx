import { motion, useMotionValue, useSpring } from 'framer-motion';
import { forwardRef, type ButtonHTMLAttributes, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  magnetism?: number;
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, className, variant = 'primary', magnetism = 0.35, onMouseMove, onMouseLeave, ...props }, _ref) => {
    const localRef = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.5 });
    const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.5 });

    const handleMouseMove: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      onMouseMove?.(e);
      const el = localRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      x.set(dx * magnetism);
      y.set(dy * magnetism);
    };

    const handleMouseLeave: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      onMouseLeave?.(e);
      x.set(0);
      y.set(0);
    };

    const base =
      'relative inline-flex items-center justify-center gap-2 font-medium tracking-tight ' +
      'transition-colors duration-300 rounded-full px-7 py-3 text-sm select-none ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950';

    const variants = {
      primary:
        'bg-bone-100 text-ink-950 hover:bg-white shadow-[0_10px_40px_-10px_rgba(243,239,231,0.4)]',
      ghost:
        'bg-white/[0.03] text-bone-100 hover:bg-white/[0.08] border border-white/10 backdrop-blur',
      outline:
        'bg-transparent text-bone-100 border border-white/15 hover:border-violet-400/60 hover:text-violet-300',
    };

    return (
      <motion.button
        ref={localRef}
        style={{ x: sx, y: sy }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(base, variants[variant], className)}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {children}
      </motion.button>
    );
  },
);
MagneticButton.displayName = 'MagneticButton';
