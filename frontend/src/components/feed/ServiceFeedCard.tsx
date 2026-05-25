import { Link } from 'react-router-dom';
import { Star, MapPin, IndianRupee, ShieldCheck, Wrench, Phone, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';

interface ServiceFeedItem {
  id: string;
  title: string;
  category: string;
  customCategory: string | null;
  description: string;
  rate: number | null;
  ratePeriod: string | null;
  serviceArea: string | null;
  yearsExperience: number;
  avgRating: number;
  ratingCount: number;
  isVerified: boolean;
  user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; city: string | null; state: string | null };
}

export function ServiceFeedCard({ service }: { service: ServiceFeedItem }) {
  const displayCategory =
    service.category === 'OTHER' && service.customCategory
      ? service.customCategory
      : service.category.replace('_', ' ').toLowerCase();

  return (
    <Link
      to={`/dashboard/services/${service.id}`}
      className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
    >
      {/* Type pill */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-medium">
          <Wrench className="w-3 h-3" />
          SERVICE
        </div>
        <span className="text-[10px] text-zinc-500 capitalize">{displayCategory}</span>
        {service.isVerified && (
          <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
            <ShieldCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <Avatar user={service.user} size={48} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base">
            {service.user.firstName} {service.user.lastName}
          </h3>
          <p className="text-xs text-zinc-300 mt-0.5">{service.title}</p>

          <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{service.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px]">
            {service.ratingCount > 0 ? (
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-medium">{service.avgRating.toFixed(1)}</span>
                <span className="text-zinc-500">({service.ratingCount})</span>
              </span>
            ) : (
              <span className="text-zinc-500">New</span>
            )}
            {service.yearsExperience > 0 && (
              <span className="text-zinc-400">{service.yearsExperience} yr exp</span>
            )}
            {(service.serviceArea || service.user.city) && (
              <span className="flex items-center gap-1 text-zinc-400">
                <MapPin className="w-3 h-3" />
                {service.serviceArea || `${service.user.city}${service.user.state ? `, ${service.user.state}` : ''}`}
              </span>
            )}
            {service.rate && (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <IndianRupee className="w-3 h-3" />
                {service.rate} {service.ratePeriod || ''}
              </span>
            )}
          </div>

          {/* Quick contact buttons */}
          <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            <Link
              to={`/dashboard/messages/${service.user.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium"
            >
              <MessageSquare className="w-3 h-3" />
              Message
            </Link>
            <span className="text-[10px] text-zinc-500">or tap card for details</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
