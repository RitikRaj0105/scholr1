import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    q: 'Is Scholr actually free, or is this a "free trial" trick?',
    a: "The Free tier is permanent — no card, no expiry. You get the AI mentor with reasonable limits, daily focus sessions, and basic study tools. Pro unlocks unlimited usage and advanced AI models. Most students stay on Free for months and convert when they hit a real workload jump.",
  },
  {
    q: 'How does Focus Mode actually block apps and websites?',
    a: "On web, Scholr ships a browser extension that intercepts known distraction domains during active focus sessions. On mobile, the companion app uses iOS Screen Time / Android Digital Wellbeing APIs with your permission. Hard blocks for paid users; nag-walls for Free.",
  },
  {
    q: 'Can the AI mentor see my private chats and grades?',
    a: "Only what you explicitly upload or sync. Your chat history with the mentor is encrypted at rest, never used to train external models, and you can wipe it any time from Settings → Privacy. Institutional accounts have additional admin controls.",
  },
  {
    q: 'How does AI test generation work — is it just GPT spitting out questions?',
    a: "It's a layered pipeline: curriculum graph → topic selection by mastery gaps → question generation with constraint validators → difficulty calibration against historical attempts → human-style explanations. The model can't ship a test until validators pass.",
  },
  {
    q: 'My institution wants to deploy this for 5,000 students. What does that look like?',
    a: "Institutional rollouts include a dedicated subdomain, SSO with your existing IdP (Google Workspace, Microsoft, Azure AD), bulk roster import, white-labeling, a success manager during onboarding, and quarterly business reviews. Typical setup is 2–3 weeks.",
  },
  {
    q: 'Do students keep their data if their school stops using Scholr?',
    a: "Yes. Personal accounts and progress are owned by the student, not the institution. If your school discontinues, your account converts to a personal Free account and all study history, AI conversations, and achievements migrate seamlessly.",
  },
  {
    q: 'Is there a refund policy for Pro?',
    a: "14 days, no questions, full refund — even if you used the whole 14 days. We'd rather you not pay than feel stuck. Annual plans get prorated refunds on remaining months.",
  },
];

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-bone-400 text-xs uppercase tracking-[0.2em] mb-6">
            <span>Questions</span>
          </div>
          <h2 className="font-display text-5xl md:text-display-md text-bone-50 leading-[0.95]">
            Things people <span className="italic text-bone-300">ask.</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`rounded-2xl border bg-ink-900/40 backdrop-blur-sm overflow-hidden transition-colors ${
                  isOpen ? 'border-violet-500/30' : 'border-white/10'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left group"
                >
                  <span
                    className={`font-display text-lg pr-6 transition-colors ${
                      isOpen ? 'text-bone-50' : 'text-bone-200'
                    } group-hover:text-bone-50`}
                  >
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                      isOpen
                        ? 'border-violet-500/40 text-violet-300'
                        : 'border-white/10 text-bone-400'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-bone-300/90 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-bone-400/80 mb-4">Still stuck on something?</p>
          <a
            href="mailto:hello@scholr.app"
            className="inline-flex items-center gap-2 text-bone-100 hover:text-violet-300 transition-colors border-b border-white/20 hover:border-violet-300 pb-1"
          >
            Email us directly →
          </a>
        </div>
      </div>
    </section>
  );
};
