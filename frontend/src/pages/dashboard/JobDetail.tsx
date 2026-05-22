import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, IndianRupee, Clock, Briefcase, Phone, MessageSquare,
  Check, Loader2, Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading } = useQuery<{ job: any; appliedAt: string | null }>({
    queryKey: ['job', id],
    queryFn: async () => (await api.get(`/jobs/${id}`)).data,
    enabled: !!id,
  });

  const apply = useMutation({
    mutationFn: () => api.post(`/jobs/${id}/apply`, { coverLetter: coverLetter.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', id] });
      setShowApply(false);
      setCoverLetter('');
    },
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/dashboard/jobs');
    },
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
      </DashboardLayout>
    );
  }

  const job = data.job;
  const isMyJob = job.recruiter.id === me?.id;
  const hasApplied = !!data.appliedAt;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Hero */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl text-white">{job.title}</h1>
              <p className="text-sm text-zinc-400 mt-1">{job.company}</p>
            </div>
            {isMyJob && (
              <button
                onClick={() => { if (confirm('Delete this listing?')) del.mutate(); }}
                className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
            {job.location && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800"><MapPin className="w-3 h-3" />{job.location}</span>
            )}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800"><Briefcase className="w-3 h-3" />{job.type.replace('_', ' ').toLowerCase()}</span>
            {(job.salaryMin || job.salaryMax || job.dailyWage) && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                <IndianRupee className="w-3 h-3" />
                {job.dailyWage
                  ? `${job.dailyWage} ${job.payPeriod || 'per day'}`
                  : `${job.salaryMin ? `₹${(job.salaryMin / 1000).toFixed(0)}k` : ''}${job.salaryMin && job.salaryMax ? ' – ' : ''}${job.salaryMax ? `₹${(job.salaryMax / 1000).toFixed(0)}k` : ''}`
                }
              </span>
            )}
            <span className="flex items-center gap-1.5 text-zinc-500"><Clock className="w-3 h-3" />{timeAgo(job.postedAt)}</span>
          </div>

          {/* Description */}
          <div className="mt-5 pt-5 border-t border-zinc-800">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Contact phone (for gig jobs) */}
          {job.contactPhone && (
            <div className="mt-5 pt-5 border-t border-zinc-800">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">Direct contact</p>
              <a href={`tel:${job.contactPhone}`} className="inline-flex items-center gap-2 text-base font-medium text-emerald-400 hover:text-emerald-300">
                <Phone className="w-4 h-4" /> {job.contactPhone}
              </a>
            </div>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-zinc-800">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-medium">Skills required</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s: string) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="mt-5 pt-5 border-t border-zinc-800 flex items-center justify-between gap-3">
            <Link to={`/dashboard/profile/${job.recruiter.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Avatar user={job.recruiter} size={36} />
              <div>
                <p className="text-sm font-medium text-white">{job.recruiter.firstName} {job.recruiter.lastName}</p>
                <p className="text-[11px] text-zinc-500">Posted this job</p>
              </div>
            </Link>

            {!isMyJob && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/dashboard/messages/${job.recruiter.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-800 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </Link>
                {hasApplied ? (
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    <Check className="w-3.5 h-3.5" /> Applied
                  </span>
                ) : (
                  <button
                    onClick={() => setShowApply(true)}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                  >
                    Apply now
                  </button>
                )}
              </div>
            )}
            {isMyJob && (
              <Link
                to={`/dashboard/jobs/${id}/applications`}
                className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                View applications
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {showApply && (
        <div onClick={() => setShowApply(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6"
          >
            <h3 className="font-display text-xl text-white mb-1">Apply to this job</h3>
            <p className="text-xs text-zinc-400 mb-4">Add an optional note to the recruiter. Your profile will be shared.</p>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Tell them why you're a good fit (optional)…"
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowApply(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800">Cancel</button>
              <button
                onClick={() => apply.mutate()}
                disabled={apply.isPending}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                {apply.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Send application
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
