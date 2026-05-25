import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HardHat, Briefcase, MapPin, IndianRupee } from 'lucide-react';
import { api } from '@/lib/api';

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  category: string;
  type: string;
  salaryMin: number | null;
  salaryMax: number | null;
  dailyWage: number | null;
  payPeriod: string | null;
}

export const JobsBell = () => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch suggested jobs only when the user opens the dropdown
  const { data: jobs = [], isLoading } = useQuery<JobItem[]>({
    queryKey: ['jobs-suggested-preview'],
    queryFn: async () => (await api.get('/jobs/suggested?limit=6')).data.jobs,
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg border border-white/[0.06] text-bone-300 hover:text-bone-100 hover:bg-white/[0.03] flex items-center justify-center transition-colors"
        title="Jobs"
      >
        <HardHat className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/[0.08] bg-ink-900 shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-bone-100">Suggested for you</h3>
                <p className="text-[10px] text-bone-500 mt-0.5">Matched to your profile</p>
              </div>
              <Link
                to="/dashboard/jobs"
                onClick={() => setOpen(false)}
                className="text-[11px] text-violet-400 hover:text-violet-300"
              >
                See all
              </Link>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-bone-400">Finding matches…</div>
              ) : jobs.length === 0 ? (
                <div className="p-6 text-center">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-bone-500/40" />
                  <p className="text-xs text-bone-400">No suggestions yet</p>
                  <p className="text-[10px] text-bone-500 mt-1">
                    Complete your profile and add skills to see matches.
                  </p>
                </div>
              ) : (
                jobs.map((j) => (
                  <Link
                    key={j.id}
                    to={`/dashboard/jobs/${j.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    <p className="text-xs font-semibold text-bone-100 truncate">{j.title}</p>
                    <p className="text-[11px] text-bone-400 truncate">{j.company}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-bone-500">
                      {j.location && (
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{j.location}</span>
                      )}
                      {(j.dailyWage || j.salaryMin) && (
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <IndianRupee className="w-2.5 h-2.5" />
                          {j.dailyWage
                            ? `${j.dailyWage} ${j.payPeriod || 'per day'}`
                            : j.salaryMin ? `${(j.salaryMin / 1000).toFixed(0)}k+` : ''}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="px-3 py-2 border-t border-white/[0.06] bg-white/[0.02]">
              <Link
                to="/dashboard/jobs"
                onClick={() => setOpen(false)}
                className="block text-center text-[11px] text-violet-400 hover:text-violet-300 py-1"
              >
                + Post a job
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
