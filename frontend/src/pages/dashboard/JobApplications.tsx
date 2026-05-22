import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Phone, Mail, FileText, MapPin, Users, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

export default function JobApplications() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<{ job: any; applications: any[] }>({
    queryKey: ['job-applications', id],
    queryFn: async () => (await api.get(`/jobs/${id}/applications`)).data,
    enabled: !!id,
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate(`/dashboard/jobs/${id}`)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to job
        </button>

        <div>
          <p className="text-xs text-zinc-500">Applicants for</p>
          <h1 className="font-display text-2xl text-white">{data.job.title}</h1>
          <p className="text-xs text-zinc-400 mt-1">{data.applications.length} applicant{data.applications.length !== 1 ? 's' : ''}</p>
        </div>

        {data.applications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-400">No applications yet. Share the listing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.applications.map((a) => (
              <div key={a.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/dashboard/profile/${a.user.id}`}>
                    <Avatar user={a.user} size={48} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/dashboard/profile/${a.user.id}`} className="hover:underline">
                      <p className="text-sm font-semibold text-white">{a.user.firstName} {a.user.lastName}</p>
                    </Link>
                    {a.user.headline && <p className="text-xs text-zinc-400 mt-0.5">{a.user.headline}</p>}

                    {/* Contact info — note: these may be null if user has hidden them */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-zinc-400">
                      {a.user.city && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.user.city}{a.user.state && `, ${a.user.state}`}</span>
                      )}
                      {a.user.phone && (
                        <a href={`tel:${a.user.phone}`} className="flex items-center gap-1 hover:text-emerald-400">
                          <Phone className="w-3 h-3" />{a.user.phone}
                        </a>
                      )}
                      {a.user.email && (
                        <a href={`mailto:${a.user.email}`} className="flex items-center gap-1 hover:text-violet-400">
                          <Mail className="w-3 h-3" />{a.user.email}
                        </a>
                      )}
                    </div>

                    {/* Skills */}
                    {a.user.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.user.skills.slice(0, 5).map((s: string) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Cover letter */}
                    {a.coverLetter && (
                      <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <p className="text-xs text-zinc-300 whitespace-pre-wrap">{a.coverLetter}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        to={`/dashboard/messages/${a.user.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" /> Message
                      </Link>
                      {a.user.resumeUrl && (
                        <a
                          href={a.user.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800 transition-colors"
                        >
                          <FileText className="w-3 h-3" /> Resume
                        </a>
                      )}
                      <span className="text-[10px] text-zinc-500 ml-auto">
                        {new Date(a.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
