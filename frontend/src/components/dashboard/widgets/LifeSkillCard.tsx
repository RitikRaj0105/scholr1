import { Lightbulb, Play, ChevronRight } from 'lucide-react';

const LESSONS = [
  {
    icon: '💰',
    title: 'How compound interest actually works',
    category: 'Personal finance',
    duration: '5 min',
    description:
      "The single most important math you'll use in adult life. We'll show you the rule of 72.",
  },
  {
    icon: '🗣️',
    title: 'Saying "no" without burning bridges',
    category: 'Communication',
    duration: '4 min',
    description:
      "Five phrasings that protect your time and your relationships.",
  },
  {
    icon: '🧠',
    title: 'Spaced repetition: the science of remembering',
    category: 'Study skills',
    duration: '6 min',
    description:
      'Why cramming fails and how 15 minutes a day beats 5 hours on Sunday.',
  },
  {
    icon: '📧',
    title: 'Writing emails that get replies',
    category: 'Communication',
    duration: '5 min',
    description:
      'The three-sentence formula used by every senior professional.',
  },
  {
    icon: '🍎',
    title: 'What actually counts as a balanced meal',
    category: 'Wellness',
    duration: '5 min',
    description:
      'The plate method — no calorie counting required.',
  },
  {
    icon: '⏰',
    title: 'Time blocking 101',
    category: 'Productivity',
    duration: '4 min',
    description:
      "Why to-do lists fail and what successful people do instead.",
  },
];

export const LifeSkillCard = () => {
  // Pick by day-of-year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const lesson = LESSONS[day % LESSONS.length];

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-base text-bone-50 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-300" />
          Life skill of the day
        </div>
        <button className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1">
          All lessons <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="rounded-xl bg-ink-950/40 border border-white/5 p-4 mb-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{lesson.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-bone-50 mb-1 leading-snug">
              {lesson.title}
            </div>
            <div className="text-[10px] text-bone-400 uppercase tracking-wider mb-2">
              {lesson.category} · {lesson.duration}
            </div>
            <p className="text-xs text-bone-300 leading-relaxed">
              {lesson.description}
            </p>
          </div>
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-sm rounded-xl transition-colors">
        <Play className="w-3.5 h-3.5" />
        Start 5-min lesson
      </button>
    </div>
  );
};
