import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Award,
  Sparkles,
  Send,
  Globe,
  Users,
  Lock,
  AlertCircle,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type PostType = 'POST' | 'ACHIEVEMENT' | 'CERTIFICATE' | 'MILESTONE';
type Visibility = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';

const VIS_OPTIONS: { value: Visibility; label: string; description: string; icon: any }[] = [
  { value: 'PUBLIC', label: 'Public', description: 'Anyone on Scholr can see this', icon: Globe },
  {
    value: 'FOLLOWERS_ONLY',
    label: 'Followers only',
    description: 'Only people who follow you',
    icon: Users,
  },
  { value: 'PRIVATE', label: 'Only you', description: 'Just for you (like a diary entry)', icon: Lock },
];

export const CreatePost = () => {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [content, setContent] = useState('');
  const [type, setType] = useState<PostType>('POST');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [showVisPicker, setShowVisPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Achievement fields
  const [achTitle, setAchTitle] = useState('');
  const [achSubject, setAchSubject] = useState('');
  const [achScore, setAchScore] = useState('');

  // Certificate fields
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certUrl, setCertUrl] = useState('');

  const initials = (me?.firstName?.[0] || me?.email?.[0] || '?').toUpperCase();

  const reset = () => {
    setContent('');
    setType('POST');
    setVisibility('PUBLIC');
    setAchTitle('');
    setAchSubject('');
    setAchScore('');
    setCertTitle('');
    setCertIssuer('');
    setCertUrl('');
    setError(null);
  };

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = { content, type, visibility };
      if (type === 'ACHIEVEMENT' && achTitle) {
        payload.achievement = {
          title: achTitle,
          ...(achSubject ? { subject: achSubject } : {}),
          ...(achScore ? { score: achScore } : {}),
        };
      }
      if (type === 'CERTIFICATE' && certTitle && certIssuer) {
        payload.certificate = {
          title: certTitle,
          issuer: certIssuer,
          ...(certUrl ? { credentialUrl: certUrl } : {}),
        };
      }
      return (await api.post('/social/posts', payload)).data;
    },
    onSuccess: () => {
      reset();
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error?.message || err?.message || 'Could not post');
    },
  });

  const canPost =
    content.trim().length > 0 &&
    (type !== 'ACHIEVEMENT' || achTitle.trim().length > 0) &&
    (type !== 'CERTIFICATE' || (certTitle.trim() && certIssuer.trim()));

  const VisIcon = VIS_OPTIONS.find((v) => v.value === visibility)!.icon;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'ACHIEVEMENT'
                ? 'Share what you achieved! e.g. "Just scored 95% on my JEE Mock!"'
                : type === 'CERTIFICATE'
                ? 'Tell people about your new certification…'
                : "What's on your mind?"
            }
            maxLength={5000}
            rows={content || type !== 'POST' ? 3 : 2}
            className="w-full px-3 py-2 bg-transparent text-sm text-bone-100 placeholder:text-bone-400/50 focus:outline-none resize-none border-b border-white/[0.04] focus:border-violet-500/30 transition-colors"
          />

          {/* Type-specific fields */}
          <AnimatePresence>
            {type === 'ACHIEVEMENT' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3 mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-amber-400 uppercase tracking-wider font-medium">
                    <Trophy className="w-3 h-3" />
                    Achievement details
                  </div>
                  <input
                    value={achTitle}
                    onChange={(e) => setAchTitle(e.target.value)}
                    placeholder="Title (e.g. JEE Mock Score)"
                    maxLength={120}
                    className="w-full px-3 py-1.5 bg-ink-950 border border-white/[0.08] rounded-md text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-amber-500/40"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={achSubject}
                      onChange={(e) => setAchSubject(e.target.value)}
                      placeholder="Subject (optional)"
                      maxLength={60}
                      className="px-3 py-1.5 bg-ink-950 border border-white/[0.08] rounded-md text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-amber-500/40"
                    />
                    <input
                      value={achScore}
                      onChange={(e) => setAchScore(e.target.value)}
                      placeholder="Score (e.g. 95%)"
                      maxLength={40}
                      className="px-3 py-1.5 bg-ink-950 border border-white/[0.08] rounded-md text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-amber-500/40"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {type === 'CERTIFICATE' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-3 mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-violet-400 uppercase tracking-wider font-medium">
                    <Award className="w-3 h-3" />
                    Certificate details
                  </div>
                  <input
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="Certificate title (e.g. AWS Cloud Practitioner)"
                    maxLength={120}
                    className="w-full px-3 py-1.5 bg-ink-950 border border-white/[0.08] rounded-md text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
                  />
                  <input
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="Issuer (e.g. AWS, Coursera, NPTEL)"
                    maxLength={80}
                    className="w-full px-3 py-1.5 bg-ink-950 border border-white/[0.08] rounded-md text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
                  />
                  <input
                    value={certUrl}
                    onChange={(e) => setCertUrl(e.target.value)}
                    placeholder="Credential URL (optional)"
                    maxLength={300}
                    className="w-full px-3 py-1.5 bg-ink-950 border border-white/[0.08] rounded-md text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Action bar */}
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setType(type === 'ACHIEVEMENT' ? 'POST' : 'ACHIEVEMENT')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  type === 'ACHIEVEMENT'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'border border-white/[0.06] text-bone-300 hover:bg-white/[0.03]'
                }`}
              >
                <Trophy className="w-3 h-3" />
                Achievement
              </button>
              <button
                onClick={() => setType(type === 'CERTIFICATE' ? 'POST' : 'CERTIFICATE')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  type === 'CERTIFICATE'
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                    : 'border border-white/[0.06] text-bone-300 hover:bg-white/[0.03]'
                }`}
              >
                <Award className="w-3 h-3" />
                Certificate
              </button>

              {/* Visibility selector */}
              <div className="relative">
                <button
                  onClick={() => setShowVisPicker(!showVisPicker)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-white/[0.06] text-bone-300 hover:bg-white/[0.03] transition-colors"
                >
                  <VisIcon className="w-3 h-3" />
                  {VIS_OPTIONS.find((v) => v.value === visibility)!.label}
                </button>
                <AnimatePresence>
                  {showVisPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-0 top-9 z-20 w-64 rounded-lg border border-white/[0.08] bg-ink-900 shadow-xl py-1"
                    >
                      {VIS_OPTIONS.map((v) => {
                        const Icon = v.icon;
                        return (
                          <button
                            key={v.value}
                            onClick={() => {
                              setVisibility(v.value);
                              setShowVisPicker(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs flex items-start gap-2 transition-colors ${
                              visibility === v.value
                                ? 'bg-violet-500/10 text-violet-300'
                                : 'text-bone-200 hover:bg-white/[0.03]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium">{v.label}</div>
                              <div className="text-[10px] text-bone-400 mt-0.5">
                                {v.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(content || type !== 'POST') && (
                <button
                  onClick={reset}
                  className="text-xs text-bone-400 hover:text-bone-200 px-2 py-1.5 transition-colors"
                >
                  Clear
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => create.mutate()}
                disabled={!canPost || create.isPending}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-ink-700 disabled:text-bone-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-3 h-3" />
                {create.isPending ? 'Posting…' : 'Post'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
