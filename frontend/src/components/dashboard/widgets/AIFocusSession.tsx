import { useNavigate } from 'react-router-dom';
import { Brain, Play, Zap } from 'lucide-react';

// Static suggestion for now — would derive from exam attempts + focus history
const suggestion = {
  topic: "Pick a topic you've been avoiding",
  subject: 'Deep work',
  duration: 25,
  reason:
    "25 minutes is enough to break the stuck-point. Don't overthink — start.",
};

export const AIFocusSession = () => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Brain className="w-4 h-4 text-violet-300" />
        </div>
        <div>
          <div className="font-display text-base text-bone-50">
            AI focus session
          </div>
          <div className="text-[11px] text-bone-400">Recommended for you</div>
        </div>
      </div>

      <div className="rounded-xl bg-ink-950/40 border border-white/5 p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-magenta-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-bone-400">
            Suggested
          </span>
        </div>
        <div className="text-sm text-bone-50 mb-1">{suggestion.topic}</div>
        <div className="text-xs text-bone-400">
          {suggestion.duration} min · {suggestion.subject}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-bone-400 mb-4">
        <Zap className="w-3 h-3 text-violet-300 mt-0.5 flex-shrink-0" />
        <span className="leading-relaxed">{suggestion.reason}</span>
      </div>

      <button
        onClick={() => navigate('/dashboard/focus')}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-bone-50 hover:bg-white text-ink-950 text-sm font-medium rounded-xl transition-colors"
      >
        <Play className="w-3.5 h-3.5" />
        Start focus session
      </button>
    </div>
  );
};
