import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Clock, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

export default function MyApplications() {
  const navigate = useNavigate();

  const { data: applications = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-applications'],
    queryFn: async () => (await api.get('/jobs/me/applications')).data.applications,
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate('/dashboard/jobs')} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to jobs
        </button>

        <div>
          <h1 className="font-display text-2xl text-white">My applications</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-400">You haven't applied to any jobs yet.</p>
            <Link to="/dashboard/jobs" className="mt-4 inline-block text-xs text-violet-400 hover:text-violet-300">
              Browse jobs →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((a) => (
              <Link
                key={a.id}
                to={`/dashboard/jobs/${a.job.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.job.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{a.job.company}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        {a.status}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Applied {new Date(a.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
