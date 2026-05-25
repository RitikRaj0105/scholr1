import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, HardHat, X, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const QUICK_CATEGORIES = [
  { value: 'DRIVER', label: 'Driver' },
  { value: 'COOK', label: 'Cook' },
  { value: 'HOUSEHOLD', label: 'Household help' },
  { value: 'SECURITY', label: 'Security guard' },
  { value: 'LABOUR', label: 'Labour' },
  { value: 'ELECTRICIAN', label: 'Electrician / Plumber' },
  { value: 'GARDENER', label: 'Gardener' },
  { value: 'BEAUTY', label: 'Beauty / Salon' },
  { value: 'RETAIL', label: 'Retail / Shop' },
  { value: 'EDUCATION', label: 'Tutor / Teacher' },
  { value: 'TECH', label: 'Tech / IT' },
  { value: 'PROFESSIONAL', label: 'Office / Professional' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'OTHER', label: 'Other' },
];

export function QuickPostJob({ defaultOpen = false, compact = false }: { defaultOpen?: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState({
    title: '',
    category: 'OTHER',
    location: '',
    description: '',
    dailyWage: '',
    contactPhone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const post = useMutation({
    mutationFn: () => {
      const payload: any = {
        title: form.title.trim(),
        category: form.category,
        type: 'GIG',
        location: form.location.trim() || undefined,
        description: form.description.trim(),
      };
      if (form.dailyWage) payload.dailyWage = parseInt(form.dailyWage);
      if (form.contactPhone.trim()) payload.contactPhone = form.contactPhone.trim();
      return api.post('/jobs/quick', payload);
    },
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['jobs-suggested'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      setForm({ title: '', category: 'OTHER', location: '', description: '', dailyWage: '', contactPhone: '' });
      setOpen(false);
      navigate(`/dashboard/jobs/${r.data.job.id}`);
    },
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Could not post'),
  });

  const submit = () => {
    setError(null);
    if (form.title.trim().length < 2) return setError('Please add a title');
    if (form.description.trim().length < 5) return setError('Please add a short description');
    post.mutate();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`group w-full rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 hover:border-violet-500/50 hover:bg-violet-500/[0.04] transition-all ${
          compact ? 'p-3' : 'p-4'
        }`}
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
            <HardHat className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 flex items-center gap-1.5">
              Need a worker? Post a job
              <Sparkles className="w-3 h-3 text-amber-400" />
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cook, driver, electrician, tutor… anyone can post in 30 seconds
            </p>
          </div>
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-violet-400" />
        </div>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-violet-500/30 bg-zinc-900 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Quick post a job</h3>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-zinc-800 rounded">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <input
          value={form.title}
          onChange={updateField('title')}
          placeholder="What do you need? e.g. Driver for 2 days, Cook for evening shift"
          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.category}
            onChange={updateField('category')}
            className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
          >
            {QUICK_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            value={form.location}
            onChange={updateField('location')}
            placeholder="Location"
            className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <textarea
          value={form.description}
          onChange={updateField('description')}
          rows={2}
          placeholder="Describe what's needed, hours, and any requirements…"
          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.dailyWage}
            onChange={updateField('dailyWage')}
            type="number"
            placeholder="₹ per day (optional)"
            className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
          <input
            value={form.contactPhone}
            onChange={updateField('contactPhone')}
            placeholder="Phone (optional)"
            className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-500">
            Tip: include the area name and hours. Workers nearby will see this.
          </p>
          <button
            onClick={submit}
            disabled={post.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex-shrink-0"
          >
            {post.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Post job
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
