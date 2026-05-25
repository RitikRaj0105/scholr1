import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, IndianRupee, Phone, Mail, MessageSquare,
  ShieldCheck, Calendar, Globe, Clock, Loader2, Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [showReview, setShowReview] = useState(false);

  const { data, isLoading } = useQuery<{ profile: any }>({
    queryKey: ['service', id],
    queryFn: async () => (await api.get(`/services/${id}`)).data,
    enabled: !!id,
  });

  const recordContact = useMutation({
    mutationFn: () => api.post(`/services/${id}/contact`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service', id] }),
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
      </DashboardLayout>
    );
  }

  const p = data.profile;
  const isMine = p.user.id === me?.id;
  const displayCategory = p.category === 'OTHER' && p.customCategory ? p.customCategory : p.category.replace('_', ' ').toLowerCase();
  const myExistingReview = p.reviews?.find((r: any) => r.reviewer.id === me?.id);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Hero */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:p-6">
          <div className="flex items-start gap-4">
            <Avatar user={p.user} size={72} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl md:text-2xl text-white">
                  {p.user.firstName} {p.user.lastName}
                </h1>
                {p.isVerified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-300 mt-1">{p.title}</p>
              <p className="text-xs text-violet-400 mt-0.5 capitalize">{displayCategory}</p>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
                {p.ratingCount > 0 ? (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-semibold">{p.avgRating.toFixed(1)}</span>
                    <span className="text-zinc-500">({p.ratingCount} review{p.ratingCount !== 1 ? 's' : ''})</span>
                  </span>
                ) : (
                  <span className="text-zinc-500">New provider</span>
                )}
                {p.yearsExperience > 0 && (
                  <span className="text-zinc-300">{p.yearsExperience} years experience</span>
                )}
                {p.bookingCount > 0 && (
                  <span className="text-zinc-400">{p.bookingCount} bookings</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-5 pt-5 border-t border-zinc-800">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{p.description}</p>
          </div>

          {/* Quick info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800">
            {p.rate && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Rate</p>
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-0.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {p.rate} <span className="font-normal text-zinc-400 ml-1">{p.ratePeriod || ''}</span>
                </p>
              </div>
            )}
            {p.serviceArea && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Service area</p>
                <p className="text-sm text-zinc-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {p.serviceArea}
                </p>
              </div>
            )}
            {p.availability && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Availability</p>
                <p className="text-sm text-zinc-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {p.availability}
                </p>
              </div>
            )}
            {p.languages?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Languages</p>
                <p className="text-sm text-zinc-200 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {p.languages.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Skills */}
          {p.skills?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-zinc-800">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s: string) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Contact actions */}
          {!isMine && (
            <div className="mt-5 pt-5 border-t border-zinc-800 flex flex-wrap gap-2">
              {p.user.phone && (
                <a
                  href={`tel:${p.user.phone}`}
                  onClick={() => recordContact.mutate()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call {p.user.phone}
                </a>
              )}
              <Link
                to={`/dashboard/messages/${p.user.id}`}
                onClick={() => recordContact.mutate()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-800 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </Link>
              {p.user.email && (
                <a
                  href={`mailto:${p.user.email}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-800 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              )}
              <button
                onClick={() => setShowReview(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs hover:bg-amber-500/10 transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                {myExistingReview ? 'Edit your review' : 'Leave a review'}
              </button>
            </div>
          )}
          {isMine && (
            <div className="mt-5 pt-5 border-t border-zinc-800">
              <Link to="/dashboard/services/me" className="text-xs text-violet-400 hover:text-violet-300">
                Edit your service profile →
              </Link>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-semibold text-white text-base mb-3">
            Reviews ({p._count.reviews})
          </h2>
          {p.reviews?.length === 0 ? (
            <p className="text-sm text-zinc-500">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {p.reviews.map((r: any) => (
                <div key={r.id} className="flex gap-3 pb-4 border-b border-zinc-800 last:border-0 last:pb-0">
                  <Avatar user={r.reviewer} size={32} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">
                        {r.reviewer.firstName} {r.reviewer.lastName}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3 h-3 ${n <= r.rating ? 'text-amber-400 fill-current' : 'text-zinc-700'}`}
                          />
                        ))}
                      </div>
                      {r.hired && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Hired
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 ml-auto">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && <p className="text-xs text-zinc-300 mt-1.5 whitespace-pre-wrap">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showReview && (
        <ReviewModal
          profileId={id!}
          existing={myExistingReview}
          onClose={() => setShowReview(false)}
        />
      )}
    </DashboardLayout>
  );
}

// ─── Review Modal ───────────────────────────────────

function ReviewModal({
  profileId,
  existing,
  onClose,
}: {
  profileId: string;
  existing?: { id: string; rating: number; comment: string | null; hired: boolean };
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(existing?.rating || 5);
  const [comment, setComment] = useState(existing?.comment || '');
  const [hired, setHired] = useState(existing?.hired || false);

  const submit = useMutation({
    mutationFn: () => api.post(`/services/${profileId}/reviews`, { rating, comment: comment.trim() || undefined, hired }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service', profileId] });
      onClose();
    },
  });

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6"
      >
        <h3 className="font-display text-xl text-white mb-1">
          {existing ? 'Edit your review' : 'Leave a review'}
        </h3>
        <p className="text-xs text-zinc-400 mb-4">Share your experience to help others.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star className={`w-7 h-7 ${n <= rating ? 'text-amber-400 fill-current' : 'text-zinc-700'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="What was your experience like?"
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hired}
              onChange={(e) => setHired(e.target.checked)}
              className="accent-violet-500"
            />
            I hired this person
          </label>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800">
            Cancel
          </button>
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            {submit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {existing ? 'Update' : 'Submit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
