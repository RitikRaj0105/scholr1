import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Users, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

export default function MyPostedJobs() {
  const navigate = useNavigate();

  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-posted-jobs'],
    queryFn: async () => (await api.get('/jobs/me/posted')).data.jobs,
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate('/dashboard/jobs')} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to jobs
        </button>

        <div>
          <h1 className="font-display text-2xl text-white">My job listings</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{jobs.length} listing{jobs.length !== 1 ? 's' : ''}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-400">You haven't posted any jobs yet.</p>
            <Link to="/dashboard/jobs" className="mt-4 inline-block text-xs text-violet-400 hover:text-violet-300">
              Post your first job →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/dashboard/jobs/${j.id}`} className="flex-1 min-w-0 hover:opacity-80">
                    <p className="text-sm font-semibold text-white truncate">{j.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{j.company}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                      <span>{j.category.toLowerCase()}</span>
                      <span>·</span>
                      <span>{j.type.replace('_', ' ').toLowerCase()}</span>
                      <span>·</span>
                      <span>Posted {new Date(j.postedAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                  <Link
                    to={`/dashboard/jobs/${j.id}/applications`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-500/20 transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    {j._count.applications} {j._count.applications === 1 ? 'applicant' : 'applicants'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
