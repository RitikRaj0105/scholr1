import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Megaphone, FileText, Calendar, Settings,
  Copy, Check, Loader2, ExternalLink, Video,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';
import { ClassroomStream } from '@/components/classroom/ClassroomStream';
import { ClassroomRoster } from '@/components/classroom/ClassroomRoster';
import { ClassroomAttendance } from '@/components/classroom/ClassroomAttendance';
import { ClassroomMaterials } from '@/components/classroom/ClassroomMaterials';
import { ClassroomSettings } from '@/components/classroom/ClassroomSettings';

type Tab = 'stream' | 'roster' | 'attendance' | 'materials' | 'settings';

const TABS: { value: Tab; label: string; icon: any; teacherOnly?: boolean }[] = [
  { value: 'stream', label: 'Stream', icon: Megaphone },
  { value: 'roster', label: 'Roster', icon: Users },
  { value: 'attendance', label: 'Attendance', icon: Calendar },
  { value: 'materials', label: 'Materials', icon: FileText },
  { value: 'settings', label: 'Settings', icon: Settings, teacherOnly: true },
];

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stream');
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{ classroom: any; isTeacher: boolean }>({
    queryKey: ['classroom', id],
    queryFn: async () => (await api.get(`/classroom/${id}`)).data,
    enabled: !!id,
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin t-text-muted" />
        </div>
      </DashboardLayout>
    );
  }

  const cls = data.classroom;
  const isTeacher = data.isTeacher;
  const bannerColor = cls.bannerColor || '#8b5cf6';

  const copyCode = () => {
    navigator.clipboard.writeText(cls.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Back */}
        <button onClick={() => navigate('/dashboard/classroom')} className="flex items-center gap-1.5 text-xs t-text-muted hover:t-text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          All classrooms
        </button>

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div
            className="px-6 py-8 md:px-8 md:py-10 relative"
            style={{ background: `linear-gradient(135deg, ${bannerColor} 0%, ${bannerColor}cc 50%, ${bannerColor}99 100%)` }}
          >
            <div className="absolute inset-0 opacity-25" style={{
              backgroundImage: 'radial-gradient(circle at 75% 50%, white 0%, transparent 60%)',
            }} />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="font-display text-2xl md:text-3xl text-white drop-shadow"
                >
                  {cls.name}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-white/90 mt-1"
                >
                  {cls.subject && <span>{cls.subject}</span>}
                  {cls.grade && <span> · {cls.grade}</span>}
                  {cls.schedule && <span> · {cls.schedule}</span>}
                </motion.p>
                {cls.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-xs text-white/80 mt-2 max-w-2xl"
                  >
                    {cls.description}
                  </motion.p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {isTeacher && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={copyCode}
                    className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all active:scale-95"
                    title="Copy join code"
                  >
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-white/70">Code</p>
                        <p className="font-mono text-lg font-bold text-white">{cls.code}</p>
                      </div>
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div key="check" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                            <Check className="w-4 h-4 text-emerald-300" />
                          </motion.div>
                        ) : (
                          <motion.div key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Copy className="w-3.5 h-3.5 text-white/80" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                )}
                {cls.meetingLink && (
                  <a
                    href={cls.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-sm text-emerald-100 text-xs font-medium transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join class
                  </a>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-6 mt-5 pt-5 border-t border-white/15"
            >
              <Stat label="Students" value={cls._count.enrollments} />
              <Stat label="Materials" value={cls._count.materials} />
              <Stat label="Posts" value={cls._count.announcements} />
              <Stat label="Assignments" value={cls._count.assignments} />
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg t-bg-elevated border t-border overflow-x-auto">
          {TABS.filter((t) => !t.teacherOnly || isTeacher).map((t) => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  active ? 'text-white' : 't-text-secondary hover:t-text-primary'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="cls-tab"
                    className="absolute inset-0 rounded-md bg-violet-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'stream' && <ClassroomStream classroomId={id!} isTeacher={isTeacher} />}
            {tab === 'roster' && <ClassroomRoster classroomId={id!} isTeacher={isTeacher} />}
            {tab === 'attendance' && <ClassroomAttendance classroomId={id!} isTeacher={isTeacher} />}
            {tab === 'materials' && <ClassroomMaterials classroomId={id!} isTeacher={isTeacher} />}
            {tab === 'settings' && isTeacher && <ClassroomSettings classroom={cls} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/70">{label}</p>
    </div>
  );
}
