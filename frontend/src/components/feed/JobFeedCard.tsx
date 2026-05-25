import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, Clock, Briefcase, HardHat } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';

interface JobFeedItem {
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
  postedAt: string;
  recruiter: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  _count: { applications: number };
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatPay(j: JobFeedItem) {
  if (j.dailyWage) return `₹${j.dailyWage} ${j.payPeriod || 'per day'}`;
  if (j.salaryMin && j.salaryMax) return `₹${(j.salaryMin / 1000).toFixed(0)}k–${(j.salaryMax / 1000).toFixed(0)}k`;
  if (j.salaryMin) return `₹${(j.salaryMin / 1000).toFixed(0)}k+`;
  return '';
}

export function JobFeedCard({ job }: { job: JobFeedItem }) {
  return (
    <Link
      to={`/dashboard/jobs/${job.id}`}
      className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
    >
      {/* Type pill */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
          <HardHat className="w-3 h-3" />
          JOB
        </div>
        <span className="text-[10px] text-zinc-500 capitalize">
          {job.category.toLowerCase().replace('_', ' ')} · {job.type.replace('_', ' ').toLowerCase()}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <Avatar user={job.recruiter} size={40} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base">{job.title}</h3>
          <p className="text-xs text-zinc-400">
            {job.company} · Posted by {job.recruiter.firstName} {job.recruiter.lastName}
          </p>

          <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{job.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-zinc-400">
            {job.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
            )}
            {formatPay(job) && (
              <span className="flex items-center gap-1 text-emerald-400">
                <IndianRupee className="w-3 h-3" />{formatPay(job)}
              </span>
            )}
            <span className="flex items-center gap-1 text-zinc-500">
              <Clock className="w-3 h-3" />{timeAgo(job.postedAt)}
            </span>
            {job._count.applications > 0 && (
              <span className="text-zinc-500">{job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
