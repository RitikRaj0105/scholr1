import { motion } from 'framer-motion';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  hover?: boolean;
  glow?: 'none' | 'violet' | 'cyan';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = true, glow = 'none', ...props }, ref) => {
    const glowClass =
      glow === 'violet'
        ? 'before:bg-violet-500/20'
        : glow === 'cyan'
          ? 'before:bg-cyan-400/15'
          : 'before:opacity-0';

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -4 } : undefined}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className={cn(
          'group relative rounded-2xl border border-white/[0.06] bg-white/[0.025] p-7 backdrop-blur-xl',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_30px_60px_-30px_rgba(0,0,0,0.6)]',
          'before:absolute before:-inset-px before:rounded-2xl before:opacity-0 before:transition-opacity',
          'before:duration-500 before:blur-2xl before:-z-10',
          hover && 'hover:before:opacity-100 hover:border-white/15',
          glowClass,
          className,
        )}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  },
);
GlassCard.displayName = 'GlassCard';
