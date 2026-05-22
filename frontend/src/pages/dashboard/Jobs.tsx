import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Plus, MapPin, Briefcase, IndianRupee, Clock,
  HardHat, ChefHat, Car, Home, Shield, Wrench, Sprout, Scissors, Store,
  GraduationCap, Heart, Code2, Building2, Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

const CATEGORIES = [
  { value: '', label: 'All jobs', icon: Briefcase, color: 'violet' },
  { value: 'DRIVER', label: 'Driver', icon: Car, color: 'cyan' },
  { value: 'COOK', label: 'Cook', icon: ChefHat, color: 'orange' },
  { value: 'HOUSEHOLD', label: 'Household help', icon: Home, color: 'pink' },
  { value: 'SECURITY', label: 'Security guard', icon: Shield, color: 'red' },
  { value: 'LABOUR', label: 'Labour / Construction', icon: HardHat, color: 'amber' },
  { value: 'ELECTRICIAN', label: 'Electrician / Plumber', icon: Wrench, color: 'yellow' },
  { value: 'GARDENER', label: 'Gardener', icon: Sprout, color: 'emerald' },
  { value: 'BEAUTY', label: 'Salon / Beauty', icon: Scissors, color: 'pink' },
  { value: 'RETAIL', label: 'Shop / Retail', icon: Store, color: 'blue' },
  { value: 'EDUCATION', label: 'Education', icon: GraduationCap, color: 'violet' },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: Heart, color: 'rose' },
  { value: 'TECH', label: 'Tech / IT', icon: Code2, color: 'cyan' },
  { value: 'PROFESSIONAL', label: 'Office / Professional', icon: Building2, color: 'indigo' },
];

const CATEGORY_COLORS: Record<string, string> = {
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  category: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  dailyWage: number | null;
  payPeriod: string | null;
  contactPhone: string | null;
  postedAt: string;
  recruiter: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  _count: { applications: number };
}

export default function Jobs() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showPost, setShowPost] = useState(false);

  const { data: jobs = [], isLoading } = useQuery<JobItem[]>({
    queryKey: ['jobs', category, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      return (await api.get(`/jobs?${params}`)).data.jobs;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-white">Jobs</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Find or post any job — from tech roles to daily-wage work.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/jobs/me/applications')}
              className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-800 transition-colors"
            >
              My applications
            </button>
            <button
              onClick={() => navigate('/dashboard/jobs/me/posted')}
              className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-800 transition-colors"
            >
              My listings
            </button>
            <button
              onClick={() => setShowPost(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post a job
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, or keyword…"
            className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap text-xs font-medium transition-all ${
                  active
                    ? `${CATEGORY_COLORS[c.color]} border-current`
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Jobs list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-400">No jobs match your filters yet.</p>
            <button
              onClick={() => setShowPost(true)}
              className="mt-4 text-xs text-violet-400 hover:text-violet-300"
            >
              Be the first to post one →
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} />
            ))}
          </div>
        )}

        {/* Post modal */}
        {showPost && <PostJobModal onClose={() => setShowPost(false)} />}
      </div>
    </DashboardLayout>
  );
}

function JobCard({ job, index }: { job: JobItem; index: number }) {
  const cat = CATEGORIES.find((c) => c.value === job.category) || CATEGORIES[0];
  const Icon = cat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        to={`/dashboard/jobs/${job.id}`}
        className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${CATEGORY_COLORS[cat.color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate">{job.title}</h3>
            <p className="text-sm text-zinc-400 truncate">{job.company}</p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              )}
              {(job.salaryMin || job.salaryMax || job.dailyWage) && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <IndianRupee className="w-3 h-3" />
                  {formatSalary(job)}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.postedAt)}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-500">{job.type.replace('_', ' ').toLowerCase()}</span>
            </div>

            {job._count.applications > 0 && (
              <p className="text-[10px] text-zinc-500 mt-2">{job._count.applications} {job._count.applications === 1 ? 'applicant' : 'applicants'}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function formatSalary(job: JobItem) {
  if (job.dailyWage) return `₹${job.dailyWage} ${job.payPeriod || 'per day'}`;
  if (job.salaryMin && job.salaryMax) return `₹${(job.salaryMin / 1000).toFixed(0)}k – ₹${(job.salaryMax / 1000).toFixed(0)}k`;
  if (job.salaryMin) return `₹${(job.salaryMin / 1000).toFixed(0)}k+`;
  if (job.salaryMax) return `Up to ₹${(job.salaryMax / 1000).toFixed(0)}k`;
  return '';
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Post Job Modal ──────────────────────────────────

function PostJobModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    category: 'OTHER',
    type: 'FULL_TIME',
    description: '',
    salaryMin: '',
    salaryMax: '',
    dailyWage: '',
    payPeriod: 'per day',
    contactPhone: '',
  });
  const [error, setError] = useState<string | null>(null);

  const isGig = form.type === 'GIG';

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const create = useMutation({
    mutationFn: () => {
      const payload: any = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim() || undefined,
        category: form.category,
        type: form.type,
        description: form.description.trim(),
      };
      if (isGig) {
        if (form.dailyWage) payload.dailyWage = parseInt(form.dailyWage);
        if (form.payPeriod) payload.payPeriod = form.payPeriod;
        if (form.contactPhone) payload.contactPhone = form.contactPhone.trim();
      } else {
        if (form.salaryMin) payload.salaryMin = parseInt(form.salaryMin);
        if (form.salaryMax) payload.salaryMax = parseInt(form.salaryMax);
      }
      return api.post('/jobs', payload);
    },
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      onClose();
      navigate(`/dashboard/jobs/${r.data.job.id}`);
    },
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Failed to post job'),
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-display text-xl text-white mb-4">Post a job</h3>

        <div className="space-y-3">
          <Field label="Job title *" value={form.title} onChange={updateField('title')} placeholder="e.g. Cook for small family, Software Engineer" />
          <Field label="Posted by / Company *" value={form.company} onChange={updateField('company')} placeholder="Your name or company name" />
          <Field label="Location" value={form.location} onChange={updateField('location')} placeholder="e.g. Kochas, Bihar" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Category *</label>
              <select
                value={form.category}
                onChange={updateField('category')}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Job type *</label>
              <select
                value={form.type}
                onChange={updateField('type')}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="GIG">Gig / Daily-wage</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="FREELANCE">Freelance</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          {isGig ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Daily wage (₹)" value={form.dailyWage} onChange={updateField('dailyWage')} placeholder="500" type="number" />
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Pay period</label>
                  <select
                    value={form.payPeriod}
                    onChange={updateField('payPeriod')}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="per day">per day</option>
                    <option value="per hour">per hour</option>
                    <option value="per week">per week</option>
                    <option value="per month">per month</option>
                  </select>
                </div>
              </div>
              <Field label="Contact phone" value={form.contactPhone} onChange={updateField('contactPhone')} placeholder="+91 9876543210" />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Salary min (₹)" value={form.salaryMin} onChange={updateField('salaryMin')} placeholder="30000" type="number" />
              <Field label="Salary max (₹)" value={form.salaryMax} onChange={updateField('salaryMax')} placeholder="60000" type="number" />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Description *</label>
            <textarea
              value={form.description}
              onChange={updateField('description')}
              rows={5}
              placeholder="Describe the job: what's needed, work hours, requirements…"
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800">Cancel</button>
            <button
              onClick={() => {
                setError(null);
                if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
                  setError('Title, company, and description are required');
                  return;
                }
                create.mutate();
              }}
              disabled={create.isPending}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Post job
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
    />
  </div>
);
