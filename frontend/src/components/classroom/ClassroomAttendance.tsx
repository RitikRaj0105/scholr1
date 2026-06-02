import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Check, X as XIcon, Clock, AlertCircle, ChevronLeft,
  ChevronRight, Save, Loader2, Users, QrCode, Smartphone,
  Camera, CreditCard, ShieldCheck, Mail, Send, RefreshCcw
} from 'lucide-react';
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

  // Modals/Views
  const [activeModal, setActiveModal] = useState<'qr-display' | 'card-scan' | 'student-qr-scan' | null>(null);
  const [teacherQR, setTeacherQR] = useState<string | null>(null);
  const [scanInputId, setScanInputId] = useState('');
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [studentQRInput, setStudentQRInput] = useState('');

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
    mutationFn: () => api.post(`/lms/classrooms/${classroomId}/attendance/manual`, {
      date: new Date(selectedDate).toISOString(),
      records: Object.entries(records).map(([userId, status]) => ({ userId, status })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom-attendance-sessions', classroomId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    },
  });

  const loadTeacherQR = async () => {
    try {
      const res = await api.get(`/lms/classrooms/${classroomId}/attendance/qr-code`);
      setTeacherQR(res.data.qrToken);
      setActiveModal('qr-display');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInputId.trim()) return;
    setScanMessage(null);
    try {
      const res = await api.post(`/lms/classrooms/${classroomId}/attendance/card-checkin`, {
        studentId: scanInputId.trim()
      });
      if (res.data.ok) {
        // Find student name
        const student = students.find(s => s.user.id === scanInputId.trim());
        const name = student ? `${student.user.firstName} ${student.user.lastName}` : 'Student';
        setScanMessage({
          type: 'success',
          text: `Successfully checked in ${name}! Parent notified via SMS/DB.`
        });
        setRecords(prev => ({ ...prev, [scanInputId.trim()]: 'PRESENT' }));
        setScanInputId('');
        qc.invalidateQueries({ queryKey: ['classroom-attendance-sessions', classroomId] });
      }
    } catch (err: any) {
      setScanMessage({
        type: 'error',
        text: err.response?.data?.message || 'Check-in failed. Verify Student ID.'
      });
    }
  };

  const handleStudentQRCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQRInput.trim()) return;
    setScanMessage(null);
    try {
      const res = await api.post('/lms/attendance/qr-checkin', {
        qrToken: studentQRInput.trim()
      });
      if (res.data.ok) {
        setScanMessage({
          type: 'success',
          text: 'Check-in recorded successfully! Status: PRESENT. Parents notified.'
        });
        setStudentQRInput('');
        qc.invalidateQueries({ queryKey: ['classroom-attendance-sessions', classroomId] });
      }
    } catch (err: any) {
      setScanMessage({
        type: 'error',
        text: err.response?.data?.message || 'Invalid or expired QR token.'
      });
    }
  };

  // Counts for the summary strip
  const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
  for (const userId of Object.keys(records)) {
    if (counts[records[userId]] !== undefined) {
      counts[records[userId]]++;
    }
  }

  // Student view: just show their own attendance history & self QR checkin
  if (!isTeacher) {
    return (
      <div className="space-y-6">
        {/* Student actions */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border t-border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-bone-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-violet-400" />
              Self Classroom Check-In
            </h3>
            <p className="text-xs text-bone-400 mt-1">
              Are you physically in class? Scan or enter the teacher's dynamic screen code below to check in.
            </p>
          </div>
          <button
            onClick={() => { setScanMessage(null); setActiveModal('student-qr-scan'); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all active:scale-95 whitespace-nowrap"
          >
            <QrCode className="w-4 h-4" />
            Check-In via Teacher Code
          </button>
        </div>

        <StudentAttendanceView sessions={sessions} />

        {/* Student QR check-in modal */}
        <AnimatePresence>
          {activeModal === 'student-qr-scan' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border t-border rounded-2xl max-w-md w-full p-6 space-y-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-bone-50">Scan / Submit Class QR</h4>
                    <p className="text-xs text-bone-400 mt-1">Paste the base64 dynamic QR token shown on teacher's projector screen.</p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="text-bone-400 hover:text-bone-200">
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                {scanMessage && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    scanMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                  }`}>
                    {scanMessage.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{scanMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleStudentQRCheckIn} className="space-y-4">
                  <input
                    type="text"
                    value={studentQRInput}
                    onChange={(e) => setStudentQRInput(e.target.value)}
                    placeholder="Paste the Teacher QR Code Token here..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    Verify & Check In
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Teacher Action Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date picker */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white/[0.02] border t-border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-2 rounded-xl bg-white/[0.04] border t-border hover:bg-white/[0.08] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-bone-300" />
            </button>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-wider text-bone-400 font-semibold mb-0.5">Selected Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-bone-50 font-bold focus:outline-none text-sm cursor-pointer"
              />
            </div>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-2 rounded-xl bg-white/[0.04] border t-border hover:bg-white/[0.08] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-bone-300" />
            </button>
          </div>

          <div className="text-xs text-bone-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Parent SMS dispatches active for ABSENT/LATE records.</span>
          </div>
        </div>

        {/* Scanning options */}
        <div className="flex gap-2">
          <button
            onClick={loadTeacherQR}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/15 transition-all text-center"
            title="Show dynamic check-in code"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-xs font-semibold">Broadcast QR</span>
          </button>

          <button
            onClick={() => { setScanMessage(null); setActiveModal('card-scan'); }}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 transition-all text-center"
            title="Scan student printed ID cards"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-semibold">Scan Badges</span>
          </button>
        </div>
      </div>

      {/* Grid count strip */}
      <div className="p-4 rounded-2xl bg-white/[0.01] border t-border">
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-bone-400 font-semibold mr-2">Quick Bulk Actions:</span>
          {(['PRESENT', 'ABSENT', 'LATE'] as Status[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => markAll(s)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium ${cfg.bg} ${cfg.color} hover:scale-105 transition-transform active:scale-95`}
              >
                <cfg.icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const c = counts[s];
            return (
              <div key={s} className={`rounded-xl p-3 border ${cfg.bg} text-center`}>
                <div className={`text-xl font-bold ${cfg.color}`}>{c}</div>
                <p className={`text-[10px] uppercase tracking-wider ${cfg.color} opacity-80 mt-0.5`}>{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Students List */}
      {students.length === 0 ? (
        <div className="p-16 text-center bg-white/[0.01] border border-dashed t-border rounded-2xl">
          <Users className="w-10 h-10 mx-auto mb-3 text-bone-500 opacity-40" />
          <p className="text-sm text-bone-400">No students are currently enrolled in this classroom.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students.map((e, i) => {
            const status = records[e.user.id];
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className="p-4 rounded-2xl bg-white/[0.02] border t-border flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={e.user} size={40} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-bone-100 truncate">
                      {e.user.firstName} {e.user.lastName}
                    </p>
                    <p className="text-[10px] font-mono text-bone-500 truncate mt-0.5">ID: {e.user.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(e.user.id, s)}
                        title={cfg.label}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-90 ${
                          active ? `${cfg.bg} ${cfg.color} scale-105 border-violet-500/20` : 'border-transparent text-bone-400 hover:bg-white/5'
                        }`}
                      >
                        <cfg.icon className="w-4 h-4" />
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
      <div className="sticky bottom-4 p-4 rounded-2xl bg-zinc-900 border t-border shadow-2xl flex items-center justify-between gap-4 z-10">
        <div>
          <p className="text-xs font-semibold text-bone-100">
            {Object.keys(records).length} of {students.length} students marked
          </p>
          <p className="text-[10px] text-bone-500 mt-0.5">
            {currentSession ? 'Updating database attendance record' : 'New classroom entry'}
          </p>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || Object.keys(records).length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white text-xs font-semibold transition-all active:scale-95"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 animate-bounce" /> Saved & Dispatched Alerts!
            </>
          ) : save.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Attendance
            </>
          )}
        </button>
      </div>

      {/* Broadcast QR Modal */}
      <AnimatePresence>
        {activeModal === 'qr-display' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border t-border rounded-2xl max-w-md w-full p-6 text-center space-y-6"
            >
              <div className="flex justify-between items-start text-left">
                <div>
                  <h4 className="text-base font-bold text-bone-50">Broadcast Dynamic QR Code</h4>
                  <p className="text-xs text-bone-400 mt-1">Students can scan this to check in. Expires in 5 minutes.</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-bone-400 hover:text-bone-200">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* QR Mockup */}
              <div className="mx-auto w-56 h-56 rounded-2xl bg-white p-4 flex flex-col items-center justify-center shadow-inner relative border border-violet-500/20">
                <div className="w-full h-full border-4 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 p-2">
                  <QrCode className="w-20 h-20 text-zinc-950" />
                  <span className="text-[10px] text-zinc-500 font-mono tracking-tight break-all font-semibold">
                    {teacherQR ? teacherQR.substring(0, 15) + '...' : 'GENERATING...'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-violet-400 block mb-1">Teacher Token:</span>
                <code className="text-xs text-bone-300 font-mono select-all block break-all whitespace-pre-wrap bg-black/40 p-2.5 rounded-lg border border-white/5">
                  {teacherQR}
                </code>
              </div>

              <button
                onClick={loadTeacherQR}
                className="w-full bg-white/[0.04] border t-border text-bone-300 hover:bg-white/[0.08] font-medium py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Regenerate Dynamic Token
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scan Badge Card Modal (Teacher View) */}
      <AnimatePresence>
        {activeModal === 'card-scan' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border t-border rounded-2xl max-w-md w-full p-6 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-bold text-bone-50">Scan Student ID Badge</h4>
                  <p className="text-xs text-bone-400 mt-1">Useful when students are not permitted phones in school.</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-bone-400 hover:text-bone-200">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Simulated Camera Feed */}
              <div className="relative aspect-video rounded-xl bg-zinc-950 border border-white/10 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="w-32 h-32 border-2 border-emerald-500/80 rounded-xl relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  <Camera className="w-10 h-10 text-emerald-400 animate-pulse" />
                </div>
                <div className="absolute bottom-3 text-[10px] text-bone-400 bg-black/60 px-3 py-1 rounded-full border border-white/5">
                  Scanning active... align student printed card badge.
                </div>
              </div>

              {scanMessage && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  scanMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}>
                  {scanMessage.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span>{scanMessage.text}</span>
                </div>
              )}

              {/* Manual input simulation */}
              <form onSubmit={handleCardCheckIn} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-bone-400 mb-1.5">
                    Simulation ID Card Scanner Input
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanInputId}
                      onChange={(e) => setScanInputId(e.target.value)}
                      placeholder="Paste Student ID to simulate scan..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 rounded-xl text-xs transition-colors flex items-center justify-center"
                    >
                      Scan
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-bone-500 font-semibold mb-2 uppercase">Quick Simulation shortcuts:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {students.map(s => (
                      <button
                        key={s.user.id}
                        type="button"
                        onClick={() => setScanInputId(s.user.id)}
                        className="px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-[9px] text-bone-300 hover:bg-white/[0.08]"
                      >
                        {s.user.firstName}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentAttendanceView({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) {
    return (
      <div className="p-12 text-center bg-white/[0.01] border border-dashed t-border rounded-2xl">
        <Calendar className="w-10 h-10 mx-auto mb-3 text-bone-500 opacity-40" />
        <p className="text-sm text-bone-400">No attendance history is logged for you yet in this classroom.</p>
      </div>
    );
  }

  // Calculate stats
  const total = sessions.length;
  let present = 0;
  sessions.forEach(s => {
    if (s.records[0]?.status === 'PRESENT') present++;
  });
  const rate = total > 0 ? Math.round((present / total) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.02] border t-border text-center">
          <div className="text-2xl font-bold text-violet-400">{rate}%</div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-bone-400 mt-1">Attendance Rate</p>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.02] border t-border text-center">
          <div className="text-2xl font-bold text-emerald-400">{present}</div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-bone-400 mt-1">Present Count</p>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.02] border t-border text-center">
          <div className="text-2xl font-bold text-red-400">{total - present}</div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-bone-400 mt-1">Absent/Late Count</p>
        </div>
      </div>

      {/* History table */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border t-border">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-bone-400 mb-4">Check-In Log History</h4>
        <div className="space-y-2">
          {sessions.map((s, i) => {
            const recordStatus = (s.records[0]?.status || 'ABSENT') as Status;
            const cfg = STATUS_CONFIG[recordStatus];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-bone-100">
                    {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-bone-500 mt-0.5">Chapter/Topic: {s.topic || 'General Lecture'}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
                  <cfg.icon className="w-3 h-3" />
                  <span>{cfg.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
