import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Star, MapPin, IndianRupee, ShieldCheck, Users, Briefcase,
  HardHat, ChefHat, Car, Home, Shield, Wrench, Sprout, Scissors, Store,
  GraduationCap, Heart, Code2, Building2, Loader2, Sparkles, Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

const SERVICE_CATEGORIES = [
  { value: '', label: 'All services', icon: Briefcase, color: 'violet' },
  { value: 'DRIVER', label: 'Driver', icon: Car, color: 'cyan' },
  { value: 'COOK', label: 'Cook', icon: ChefHat, color: 'orange' },
  { value: 'HOUSEHOLD', label: 'Household help', icon: Home, color: 'pink' },
  { value: 'SECURITY', label: 'Security', icon: Shield, color: 'red' },
  { value: 'LABOUR', label: 'Labour', icon: HardHat, color: 'amber' },
  { value: 'ELECTRICIAN', label: 'Electrician / Plumber', icon: Wrench, color: 'yellow' },
  { value: 'GARDENER', label: 'Gardener', icon: Sprout, color: 'emerald' },
  { value: 'BEAUTY', label: 'Beauty / Salon', icon: Scissors, color: 'pink' },
  { value: 'RETAIL', label: 'Shop / Retail', icon: Store, color: 'blue' },
  { value: 'EDUCATION', label: 'Tutor / Teacher', icon: GraduationCap, color: 'violet' },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: Heart, color: 'rose' },
  { value: 'TECH', label: 'Tech / IT', icon: Code2, color: 'cyan' },
  { value: 'OTHER', label: 'Other', icon: Sparkles, color: 'indigo' },
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

interface ServiceProfile {
  id: string;
  title: string;
  category: string;
  customCategory: string | null;
  description: string;
  rate: number | null;
  ratePeriod: string | null;
  serviceArea: string | null;
  yearsExperience: number;
  languages: string[];
  skills: string[];
  avgRating: number;
  ratingCount: number;
  bookingCount: number;
  isVerified: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    city: string | null;
    state: string | null;
  };
  _count: { reviews: number };
}

export default function Services() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);

  const { data: profiles = [], isLoading } = useQuery<ServiceProfile[]>({
    queryKey: ['services', category, search, location, minRating],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (location) params.set('location', location);
      if (minRating > 0) params.set('minRating', minRating.toString());
      return (await api.get(`/services?${params}`)).data.profiles;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-white">Find services</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Search drivers, cooks, electricians, gym trainers, and more — with ratings and reviews.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/services/me')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Offer your service
          </button>
        </div>

        {/* Search row */}
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Type "driver", "cook", "gym trainer"…'
              className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Area or city (optional)"
              className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Min rating:</span>
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`px-2.5 py-1 rounded-full border ${
                minRating === r
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {r === 0 ? 'Any' : `${r}+`} {r > 0 && <Star className="w-2.5 h-2.5 inline-block fill-current" />}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {SERVICE_CATEGORIES.map((c) => {
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

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-400">No service providers found.</p>
            <p className="text-[11px] text-zinc-500 mt-1">Try a different search, location, or category.</p>
            <button
              onClick={() => navigate('/dashboard/services/me')}
              className="mt-4 text-xs text-violet-400 hover:text-violet-300"
            >
              Are you offering services? List yourself →
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {profiles.map((p, i) => (
              <ServiceCard key={p.id} profile={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ServiceCard({ profile, index }: { profile: ServiceProfile; index: number }) {
  const cat = SERVICE_CATEGORIES.find((c) => c.value === profile.category) || SERVICE_CATEGORIES[0];
  const Icon = cat.icon;
  const displayCategory = profile.category === 'OTHER' && profile.customCategory ? profile.customCategory : cat.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        to={`/dashboard/services/${profile.id}`}
        className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
      >
        <div className="flex items-start gap-3">
          <Avatar user={profile.user} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-white">
                    {profile.user.firstName} {profile.user.lastName}
                  </p>
                  {profile.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-zinc-300 mt-0.5 line-clamp-1">{profile.title}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${CATEGORY_COLORS[cat.color]}`}>
                <Icon className="w-3 h-3" />
                <span className="whitespace-nowrap">{displayCategory}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
              {profile.ratingCount > 0 ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="font-medium">{profile.avgRating.toFixed(1)}</span>
                  <span className="text-zinc-500">({profile.ratingCount})</span>
                </span>
              ) : (
                <span className="text-zinc-500">New</span>
              )}
              {profile.yearsExperience > 0 && (
                <span className="text-zinc-400">{profile.yearsExperience} yr exp</span>
              )}
              {(profile.serviceArea || profile.user.city) && (
                <span className="flex items-center gap-1 text-zinc-400">
                  <MapPin className="w-3 h-3" />
                  {profile.serviceArea || `${profile.user.city}${profile.user.state ? `, ${profile.user.state}` : ''}`}
                </span>
              )}
              {profile.rate && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <IndianRupee className="w-3 h-3" />
                  {profile.rate} {profile.ratePeriod || ''}
                </span>
              )}
            </div>

            {/* Description preview */}
            <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{profile.description}</p>

            {/* Skills/languages chips */}
            {(profile.skills?.length > 0 || profile.languages?.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.skills.slice(0, 3).map((s) => (
                  <span key={`s-${s}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {s}
                  </span>
                ))}
                {profile.languages.slice(0, 2).map((l) => (
                  <span key={`l-${l}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
