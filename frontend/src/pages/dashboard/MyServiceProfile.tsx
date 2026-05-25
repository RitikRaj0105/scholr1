import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Loader2, Trash2, Plus, X, Sparkles, Eye, EyeOff,
  HardHat, ChefHat, Car, Home, Shield, Wrench, Sprout, Scissors, Store,
  GraduationCap, Heart, Code2, Building2, Briefcase,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

const SERVICE_CATEGORIES = [
  { value: 'DRIVER', label: 'Driver', icon: Car },
  { value: 'COOK', label: 'Cook', icon: ChefHat },
  { value: 'HOUSEHOLD', label: 'Household help', icon: Home },
  { value: 'SECURITY', label: 'Security guard', icon: Shield },
  { value: 'LABOUR', label: 'Labour / Construction', icon: HardHat },
  { value: 'ELECTRICIAN', label: 'Electrician / Plumber', icon: Wrench },
  { value: 'GARDENER', label: 'Gardener', icon: Sprout },
  { value: 'BEAUTY', label: 'Beauty / Salon', icon: Scissors },
  { value: 'RETAIL', label: 'Shop / Retail', icon: Store },
  { value: 'EDUCATION', label: 'Tutor / Teacher', icon: GraduationCap },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: Heart },
  { value: 'TECH', label: 'Tech / IT', icon: Code2 },
  { value: 'PROFESSIONAL', label: 'Office / Professional', icon: Building2 },
  { value: 'OTHER', label: 'Other', icon: Sparkles },
];

export default function MyServiceProfile() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ profile: any }>({
    queryKey: ['my-service-profile'],
    queryFn: async () => (await api.get('/services/me')).data,
  });

  const [form, setForm] = useState({
    category: 'OTHER',
    customCategory: '',
    title: '',
    description: '',
    rate: '',
    ratePeriod: 'per day',
    serviceArea: '',
    availability: '',
    yearsExperience: '',
    isActive: true,
  });
  const [languages, setLanguages] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [langInput, setLangInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Hydrate form with existing data
  useEffect(() => {
    const p = data?.profile;
    if (!p) return;
    setForm({
      category: p.category || 'OTHER',
      customCategory: p.customCategory || '',
      title: p.title || '',
      description: p.description || '',
      rate: p.rate ? String(p.rate) : '',
      ratePeriod: p.ratePeriod || 'per day',
      serviceArea: p.serviceArea || '',
      availability: p.availability || '',
      yearsExperience: p.yearsExperience ? String(p.yearsExperience) : '',
      isActive: p.isActive ?? true,
    });
    setLanguages(p.languages || []);
    setSkills(p.skills || []);
  }, [data]);

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addLang = () => {
    if (langInput.trim() && !languages.includes(langInput.trim())) {
      setLanguages([...languages, langInput.trim()]);
      setLangInput('');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const save = useMutation({
    mutationFn: () => {
      const payload: any = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        languages,
        skills,
        isActive: form.isActive,
      };
      if (form.category === 'OTHER' && form.customCategory.trim()) {
        payload.customCategory = form.customCategory.trim();
      }
      if (form.rate) payload.rate = parseInt(form.rate);
      if (form.ratePeriod) payload.ratePeriod = form.ratePeriod;
      if (form.serviceArea.trim()) payload.serviceArea = form.serviceArea.trim();
      if (form.availability.trim()) payload.availability = form.availability.trim();
      if (form.yearsExperience) payload.yearsExperience = parseInt(form.yearsExperience);
      return api.post('/services/me', payload);
    },
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['my-service-profile'] });
      qc.invalidateQueries({ queryKey: ['services'] });
      navigate(`/dashboard/services/${r.data.profile.id}`);
    },
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Could not save'),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/services/me'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-service-profile'] });
      qc.invalidateQueries({ queryKey: ['services'] });
      navigate('/dashboard/services');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
      </DashboardLayout>
    );
  }

  const isEditing = !!data?.profile;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate('/dashboard/services')} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to services
        </button>

        <div>
          <h1 className="font-display text-2xl md:text-3xl text-white">
            {isEditing ? 'Edit your service profile' : 'Offer your service'}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tell people what you do so they can find you when they search for a driver, cook, tutor, gym trainer, etc.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
              What do you do? *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SERVICE_CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = form.category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: c.value }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs text-left transition-all ${
                      active
                        ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                        : 'border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom category input when OTHER is selected */}
            {form.category === 'OTHER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 rounded-lg bg-violet-500/[0.04] border border-violet-500/20"
              >
                <label className="block text-[10px] uppercase tracking-wider text-violet-300 mb-1.5 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Type your profession *
                </label>
                <input
                  value={form.customCategory}
                  onChange={updateField('customCategory')}
                  placeholder="Type your profession here"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  Don't see your work above? Just type it here — anyone searching for it will find you.
                </p>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
              Headline *
            </label>
            <input
              value={form.title}
              onChange={updateField('title')}
              placeholder='e.g. "Experienced North Indian Cook" or "Personal Driver, 8 years"'
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
              About you *
            </label>
            <textarea
              value={form.description}
              onChange={updateField('description')}
              rows={4}
              placeholder="Describe your experience, what you offer, and any specialities…"
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Rate */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Rate (₹)
              </label>
              <input
                type="number"
                value={form.rate}
                onChange={updateField('rate')}
                placeholder="500"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Period
              </label>
              <select
                value={form.ratePeriod}
                onChange={updateField('ratePeriod')}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="per hour">per hour</option>
                <option value="per day">per day</option>
                <option value="per visit">per visit</option>
                <option value="per week">per week</option>
                <option value="per month">per month</option>
                <option value="negotiable">negotiable</option>
              </select>
            </div>
          </div>

          {/* Area + availability + experience */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Service area
              </label>
              <input
                value={form.serviceArea}
                onChange={updateField('serviceArea')}
                placeholder="e.g. Sector 21, Noida"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Availability
              </label>
              <input
                value={form.availability}
                onChange={updateField('availability')}
                placeholder="e.g. Mon-Fri evenings"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Years of experience
              </label>
              <input
                type="number"
                value={form.yearsExperience}
                onChange={updateField('yearsExperience')}
                placeholder="3"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Status
              </label>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  form.isActive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                }`}
              >
                {form.isActive ? <><Eye className="w-3.5 h-3.5" />Visible to others</> : <><EyeOff className="w-3.5 h-3.5" />Hidden</>}
              </button>
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
              Languages spoken
            </label>
            <div className="flex gap-2">
              <input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLang(); } }}
                placeholder="Hindi, English, Bhojpuri…"
                className="flex-1 px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <button type="button" onClick={addLang} className="px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium">
                Add
              </button>
            </div>
            {languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {languages.map((l) => (
                  <span key={l} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                    {l}
                    <button onClick={() => setLanguages(languages.filter((x) => x !== l))} className="text-violet-400 hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
              Skills / specialities
            </label>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="e.g. South Indian, Continental, Baking…"
                className="flex-1 px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <button type="button" onClick={addSkill} className="px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium">
                Add
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((s) => (
                  <span key={s} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                    {s}
                    <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-zinc-400 hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            {isEditing && (
              <button
                onClick={() => {
                  if (confirm('Delete your service profile? This cannot be undone.')) remove.mutate();
                }}
                className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={() => {
                setError(null);
                if (!form.title.trim() || form.title.trim().length < 2) return setError('Please add a headline');
                if (!form.description.trim() || form.description.trim().length < 10) return setError('Please add a description (at least 10 characters)');
                if (form.category === 'OTHER' && !form.customCategory.trim()) return setError('Please type your profession');
                save.mutate();
              }}
              disabled={save.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-3.5 h-3.5" />
              {isEditing ? 'Save changes' : 'Publish profile'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
