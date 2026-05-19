import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

type BillingCycle = 'monthly' | 'annual';

const plans = [
  {
    name: 'Free',
    tagline: 'For students testing the waters',
    monthly: 0,
    annual: 0,
    features: [
      'AI mentor · 50 messages/mo',
      '3 focus sessions/day',
      'Basic study planner',
      '2 AI-generated tests/week',
      'Community leaderboards',
    ],
    cta: 'Start free',
    accent: 'none',
  },
  {
    name: 'Pro',
    tagline: 'For serious learners',
    monthly: 499,
    annual: 4999,
    features: [
      'Unlimited AI mentor',
      'Unlimited focus + blocking',
      'Adaptive AI study plans',
      'Unlimited AI test generation',
      'Coding studio + run env',
      'Wellness + mood tracking',
      'Priority AI models',
    ],
    cta: 'Start Pro trial',
    accent: 'violet',
    badge: 'Most popular',
  },
  {
    name: 'Institution',
    tagline: 'For schools & colleges',
    monthly: null,
    annual: null,
    features: [
      'Everything in Pro · for every student',
      'Admin + teacher + parent portals',
      'Classroom + LMS suite',
      'Assignment auto-grading',
      'Attendance + analytics',
      'White-label deployment',
      'Dedicated success manager',
    ],
    cta: 'Talk to sales',
    accent: 'cyan',
  },
  {
    name: 'Enterprise',
    tagline: 'For recruiters & ed-orgs',
    monthly: null,
    annual: null,
    features: [
      'Everything in Institution',
      'Placement & hiring suite',
      'AI resume + interview screening',
      'Coding rounds + analytics',
      'Custom integrations & SSO',
      'On-prem deployment option',
      'SLA + 24/7 support',
    ],
    cta: 'Contact us',
    accent: 'magenta',
  },
];

const formatPrice = (plan: typeof plans[0], cycle: BillingCycle) => {
  const price = cycle === 'monthly' ? plan.monthly : plan.annual;
  if (price === null) return 'Custom';
  if (price === 0) return '₹0';
  if (cycle === 'monthly') return `₹${price}`;
  return `₹${Math.round(price / 12)}`;
};

export const Pricing = () => {
  const [cycle, setCycle] = useState<BillingCycle>('annual');

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-bone-400 text-xs uppercase tracking-[0.2em] mb-6">
            <Sparkles className="w-3 h-3" />
            <span>Pricing</span>
          </div>
          <h2 className="font-display text-5xl md:text-display-md text-bone-50 leading-[0.95] mb-6">
            Pay for the{' '}
            <span className="italic text-bone-300">outcome.</span>
          </h2>
          <p className="text-bone-300/80 text-lg">
            Start free. Upgrade when you outgrow it. Cancel anything anytime.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-14">
          <div className="relative inline-flex p-1 rounded-full border border-white/10 bg-ink-900/60 backdrop-blur-sm">
            <button
              onClick={() => setCycle('monthly')}
              className={`relative z-10 px-5 py-2 text-sm rounded-full transition-colors ${
                cycle === 'monthly' ? 'text-ink-950' : 'text-bone-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`relative z-10 px-5 py-2 text-sm rounded-full transition-colors flex items-center gap-2 ${
                cycle === 'annual' ? 'text-ink-950' : 'text-bone-300'
              }`}
            >
              Annual
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  cycle === 'annual'
                    ? 'bg-ink-950/20 text-ink-950'
                    : 'bg-violet-500/20 text-violet-300'
                }`}
              >
                -17%
              </span>
            </button>
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-1 bg-bone-50 rounded-full"
              style={{
                width: cycle === 'monthly' ? '90px' : '128px',
                left: cycle === 'monthly' ? '4px' : '94px',
              }}
            />
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => {
            const isPro = plan.accent === 'violet';
            const isCustom = plan.monthly === null;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`relative rounded-3xl border ${
                  isPro
                    ? 'border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-glow-violet'
                    : 'border-white/10 bg-ink-900/40'
                } backdrop-blur-sm p-7 flex flex-col`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500 text-white text-xs font-medium">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-display text-2xl text-bone-50 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-bone-400/80 text-sm">{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl text-bone-50">
                      {formatPrice(plan, cycle)}
                    </span>
                    {!isCustom && plan.monthly !== 0 && (
                      <span className="text-bone-400/70 text-sm">/mo</span>
                    )}
                  </div>
                  {!isCustom && cycle === 'annual' && plan.annual !== 0 && (
                    <div className="text-xs text-bone-400/60 mt-1">
                      ₹{plan.annual} billed annually
                    </div>
                  )}
                </div>

                <ul className="flex-1 space-y-3 mb-7">
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-bone-200/90"
                    >
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          isPro ? 'text-violet-400' : 'text-bone-400'
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-full text-sm font-medium transition-all ${
                    isPro
                      ? 'bg-bone-50 text-ink-950 hover:bg-white'
                      : 'border border-white/20 text-bone-100 hover:bg-white/5 hover:border-white/40'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-bone-400/60 text-sm mt-10">
          All plans include end-to-end encryption, GDPR compliance, and the
          Scholr mobile apps. Student verification unlocks 50% off Pro.
        </p>
      </div>
    </section>
  );
};
