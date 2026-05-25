import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, MessageSquare, UserMinus, Mail } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

export function ClassroomRoster({ classroomId, isTeacher }: { classroomId: string; isTeacher: boolean }) {
  const qc = useQueryClient();

  const { data: rosterData, isLoading } = useQuery<{ students: any[] }>({
    queryKey: ['classroom-roster', classroomId],
    queryFn: async () => (await api.get(`/classroom/${classroomId}/roster`)).data,
  });

  const { data: statsData } = useQuery<{ totalSessions: number; byUser: Record<string, any> }>({
    queryKey: ['classroom-attendance-stats', classroomId],
    queryFn: async () => (await api.get(`/classroom/${classroomId}/attendance/stats`)).data,
  });

  const students = rosterData?.students || [];
  const stats = statsData?.byUser || {};
  const totalSessions = statsData?.totalSessions || 0;

  const remove = useMutation({
    mutationFn: (userId: string) => api.delete(`/classroom/${classroomId}/students/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom-roster', classroomId] });
      qc.invalidateQueries({ queryKey: ['classroom', classroomId] });
    },
  });

  if (isLoading) {
    return <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="anim-shimmer h-16 rounded-xl" />)}</div>;
  }

  if (students.length === 0) {
    return (
      <div className="t-card p-10 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 t-text-muted opacity-40" />
        <p className="text-sm t-text-muted">No students enrolled yet.</p>
        <p className="text-[11px] t-text-muted mt-1">Share the join code so students can join.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {totalSessions > 0 && (
        <p className="text-xs t-text-muted px-1 mb-1">
          Attendance based on {totalSessions} session{totalSessions !== 1 ? 's' : ''}
        </p>
      )}

      {students.map((e, i) => {
        const stat = stats[e.user.id];
        const presentPct = stat && stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : null;
        const attendanceColor = presentPct === null ? 'gray' : presentPct >= 80 ? 'emerald' : presentPct >= 50 ? 'amber' : 'red';

        return (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="t-card p-3 flex items-center gap-3 group"
          >
            <Link to={`/dashboard/profile/${e.user.id}`}>
              <Avatar user={e.user} size={40} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/dashboard/profile/${e.user.id}`} className="hover:underline">
                <p className="text-sm font-medium t-text-primary truncate">
                  {e.user.firstName} {e.user.lastName}
                </p>
              </Link>
              {e.user.headline && <p className="text-[11px] t-text-muted truncate">{e.user.headline}</p>}
            </div>

            {/* Attendance percentage */}
            {presentPct !== null && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) + 0.15 }}
                className="flex flex-col items-center min-w-[60px]"
              >
                <div className={`text-base font-bold ${
                  attendanceColor === 'emerald' ? 'text-emerald-400' :
                  attendanceColor === 'amber' ? 'text-amber-400' :
                  attendanceColor === 'red' ? 'text-red-400' : 't-text-muted'
                }`}>
                  {presentPct}%
                </div>
                <div className="w-full h-1 rounded-full bg-white/10 mt-0.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${presentPct}%` }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) + 0.2, duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      attendanceColor === 'emerald' ? 'bg-emerald-400' :
                      attendanceColor === 'amber' ? 'bg-amber-400' :
                      attendanceColor === 'red' ? 'bg-red-400' : 'bg-gray-400'
                    }`}
                  />
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-1">
              <Link
                to={`/dashboard/messages/${e.user.id}`}
                className="p-1.5 rounded hover:t-bg-elevated t-text-secondary hover:t-text-primary"
                title="Message"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
              {isTeacher && (
                <button
                  onClick={() => {
                    if (confirm(`Remove ${e.user.firstName} from this classroom?`)) {
                      remove.mutate(e.user.id);
                    }
                  }}
                  className="p-1.5 rounded hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from class"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
