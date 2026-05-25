import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, X as XIcon, Clock, AlertCircle, ChevronLeft, ChevronRight, Save, Loader2, Users } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { api } from '@/lib/api';

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

const STATUS_CONFIG: Record<Status, { icon: any; color: string; bg: string; label: string }> = {
  PRESENT: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', label: 'Present' },
  ABSENT: { icon: XIcon, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'Absent' },
  LATE: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Late' },
  EXCUSED: { icon: AlertCircle, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30', label: 'Excused' },
};

export function ClassroomAttendance({ classroomId, isTeacher }: { classroomId: string; isTeacher: boolean }) {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [records, setRecords] = useState<Record<string, Status>>({});
  const [saved, setSaved] = useState(false);

  const { data: rosterData } = useQuery<{ students: any[] }>({
    queryKey: ['classroom-roster', classroomId],
    queryFn: async () => (await api.get(`/classroom/${classroomId}/roster`)).data,
  });

  const { data: sessionsData } = useQuery<{ sessions: any[] }>({
    queryKey: ['classroom-attendance-sessions', classroomId],
    queryFn: async () => (await api.get(`/classroom/${classroomId}/attendance`)).data,
  });

  const students = rosterData?.students || [];
  const sessions = sessionsData?.sessions || [];
  const currentSession = sessions.find((s) => s.date.startsWith(selectedDate));

  // Hydrate from existing session
  useEffect(() => {
    if (currentSession) {
      setTopic(currentSession.topic || '');
      const m: Record<string, Status> = {};
      for (const r of currentSession.records) m[r.userId] = r.status;
      setRecords(m);
    } else {
      setTopic('');
      setRecords({});
    }
  }, [currentSession]);

  const setStatus = (userId: string, status: Status) => {
    setRecords((prev) => ({ ...prev, [userId]: status }));
    setSaved(false);
  };

  const markAll = (status: Status) => {
    const m: Record<string, Status> = {};
    for (const s of students) m[s.user.id] = status;
    setRecords(m);
    setSaved(false);
  };

  const save = useMutation({
    mutationFn: () => api.post(`/classroom/${classroomId}/attendance`, {
      date: selectedDate,
      topic: topic.trim() || undefined,
      records: Object.entries(records).map(([userId, status]) => ({ userId, status })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom-attendance-sessions', classroomId] });
      qc.invalidateQueries({ queryKey: ['classroom-attendance-stats', classroomId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    },
  });

  // Counts for the summary strip
  const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
  for (const userId of Object.keys(records)) counts[records[userId]]++;

  // Student view: just show their own attendance history
  if (!isTeacher) {
    return <StudentAttendanceView sessions={sessions} />;
  }

  return (
    <div className="space-y-4">
      {/* Date picker + topic */}
      <div className="t-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1.5 rounded hover:t-bg-elevated"
            >
              <ChevronLeft className="w-4 h-4 t-text-secondary" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 t-input rounded-lg text-sm focus:outline-none"
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1.5 rounded hover:t-bg-elevated"
            >
              <ChevronRight className="w-4 h-4 t-text-secondary" />
            </button>
          </div>
          <input
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setSaved(false); }}
            placeholder="Topic / chapter (optional)"
            className="flex-1 min-w-[200px] px-3 py-1.5 t-input rounded-lg text-sm focus:outline-none"
          />
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t t-border flex-wrap">
          <span className="text-[10px] uppercase tracking-wider t-text-muted font-medium mr-1">Mark all as:</span>
          {(['PRESENT', 'ABSENT', 'LATE'] as Status[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => markAll(s)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${cfg.bg} ${cfg.color} hover:scale-105 transition-transform active:scale-95`}
              >
                <cfg.icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Counts strip */}
        <motion.div
          layout
          className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t t-border"
        >
          {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const c = counts[s];
            return (
              <div key={s} className={`rounded-lg p-2 border ${cfg.bg} text-center`}>
                <motion.div
                  key={c}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className={`text-lg font-bold ${cfg.color}`}
                >
                  {c}
                </motion.div>
                <p className={`text-[9px] uppercase tracking-wider ${cfg.color} opacity-80`}>{cfg.label}</p>
              </div>
            );
          })}
        </motion.div>
      </div>

      {students.length === 0 ? (
        <div className="t-card p-10 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 t-text-muted opacity-40" />
          <p className="text-sm t-text-muted">No students to mark attendance for.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {students.map((e, i) => {
            const status = records[e.user.id];
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.3) }}
                className="t-card p-3 flex items-center gap-3"
              >
                <Avatar user={e.user} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium t-text-primary truncate">
                    {e.user.firstName} {e.user.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(e.user.id, s)}
                        title={cfg.label}
                        className={`relative w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-90 ${
                          active ? `${cfg.bg} ${cfg.color} scale-110` : 'border-transparent t-text-muted hover:t-bg-elevated'
                        }`}
                      >
                        {active ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            <cfg.icon className="w-3.5 h-3.5" />
                          </motion.div>
                        ) : (
                          <cfg.icon className="w-3.5 h-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Save bar */}
      <motion.div
        layout
        className="sticky bottom-4 t-card p-3 flex items-center justify-between border t-border-strong shadow-lg"
      >
        <div>
          <p className="text-xs font-medium t-text-primary">
            {Object.keys(records).length} of {students.length} students marked
          </p>
          <p className="text-[10px] t-text-muted">
            {currentSession ? 'Updating existing session' : 'New session'}
          </p>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || Object.keys(records).length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-95"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Saved!
              </motion.div>
            ) : save.isPending ? (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </motion.div>
            ) : (
              <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Save attendance
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  );
}

function StudentAttendanceView({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) {
    return (
      <div className="t-card p-10 text-center">
        <Calendar className="w-10 h-10 mx-auto mb-3 t-text-muted opacity-40" />
        <p className="text-sm t-text-muted">No attendance records yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.3) }}
          className="t-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium t-text-primary">
                {new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              {s.topic && <p className="text-xs t-text-muted mt-0.5">{s.topic}</p>}
            </div>
            <div className="text-xs t-text-secondary">
              {s.records.length} marked
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
