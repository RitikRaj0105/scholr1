import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  subject: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  durationMin: number;
  status: 'PENDING' | 'DONE' | 'SKIPPED';
  date: string;
}

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1); // Monday-first
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

const fmtDateKey = (d: Date) => d.toISOString().slice(0, 10);

const PRIORITY_TONE = {
  HIGH: 'text-magenta-300 bg-magenta-500/10 border-magenta-500/20',
  MEDIUM: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  LOW: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
};

const SUBJECT_COLOR = (s: string | null) => {
  if (!s) return 'bg-bone-400';
  const map: Record<string, string> = {
    physics: 'bg-violet-400',
    chemistry: 'bg-magenta-400',
    math: 'bg-cyan-400',
    mathematics: 'bg-cyan-400',
    biology: 'bg-green-400',
    english: 'bg-orange-400',
    history: 'bg-amber-400',
    coding: 'bg-violet-400',
    cs: 'bg-violet-400',
  };
  return map[s.toLowerCase()] || 'bg-bone-400';
};

export default function Planner() {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    durationMin: 30,
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEnd = useMemo(() => {
    const e = new Date(weekStart);
    e.setDate(e.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
  }, [weekStart]);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', fmtDateKey(weekStart)],
    queryFn: async () =>
      (
        await api.get(
          `/planner/tasks?from=${fmtDateKey(weekStart)}&to=${fmtDateKey(weekEnd)}`
        )
      ).data.tasks,
  });

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      const key = t.date.slice(0, 10);
      (map[key] = map[key] || []).push(t);
    }
    return map;
  }, [tasks]);

  const selectedKey = fmtDateKey(selectedDate);
  const selectedTasks = tasksByDay[selectedKey] || [];
  const completedToday = selectedTasks.filter((t) => t.status === 'DONE').length;
  const plannedMinutes = selectedTasks.reduce((sum, t) => sum + t.durationMin, 0);
  const completedMinutes = selectedTasks
    .filter((t) => t.status === 'DONE')
    .reduce((sum, t) => sum + t.durationMin, 0);

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/planner/tasks', {
          title: form.title,
          subject: form.subject || undefined,
          priority: form.priority,
          durationMin: form.durationMin,
          date: selectedKey,
        })
      ).data.task,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-today'] });
      setAdding(false);
      setForm({
        title: '',
        subject: '',
        priority: 'MEDIUM',
        durationMin: 30,
      });
    },
  });

  const toggle = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/planner/tasks/${id}/toggle`)).data.task,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-today'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/planner/tasks/${id}`),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-today'] });
    },
  });

  const navigateWeek = (dir: -1 | 1) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  };

  const goToday = () => {
    setWeekStart(startOfWeek(new Date()));
    setSelectedDate(new Date());
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-end justify-between gap-6 flex-wrap"
        >
          <div>
            <div className="text-sm text-bone-400 mb-1">Study Planner</div>
            <h1 className="font-display text-4xl text-bone-50">
              Plan the work. <span className="italic text-bone-300">Work the plan.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="w-9 h-9 rounded-full border border-white/10 text-bone-300 hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-4 h-9 rounded-full border border-white/10 text-bone-200 text-sm hover:bg-white/5 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="w-9 h-9 rounded-full border border-white/10 text-bone-300 hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Week strip */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map((d) => {
            const key = fmtDateKey(d);
            const dayTasks = tasksByDay[key] || [];
            const completed = dayTasks.filter((t) => t.status === 'DONE').length;
            const total = dayTasks.length;
            const isSelected = selectedKey === key;
            const isToday = fmtDateKey(new Date()) === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(d)}
                className={`relative p-4 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'border-violet-500/50 bg-violet-500/10'
                    : 'border-white/10 bg-ink-900/40 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-bone-400 mb-1">
                  {d.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`font-display text-2xl mb-2 tabular-nums ${
                    isSelected ? 'text-bone-50' : 'text-bone-100'
                  }`}
                >
                  {d.getDate()}
                </div>
                {isToday && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                )}
                {total > 0 && (
                  <div className="text-xs text-bone-400 tabular-nums">
                    {completed}/{total}
                  </div>
                )}
                {total === 0 && (
                  <div className="text-xs text-bone-400/40">–</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day */}
        <div className="grid grid-cols-12 gap-5">
          {/* Day's tasks */}
          <div className="col-span-12 lg:col-span-8 rounded-2xl border border-white/10 bg-ink-900/40 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-display text-2xl text-bone-50">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-bone-400 mt-1">
                  {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'}{' '}
                  · {plannedMinutes}m planned
                </div>
              </div>
              <button
                onClick={() => setAdding(true)}
                className="px-4 py-2 rounded-full bg-bone-50 text-ink-950 text-sm font-medium hover:bg-white transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add task
              </button>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {selectedTasks.length === 0 && !adding && (
                <div className="text-center py-12 text-bone-400">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-3 text-bone-400/40" />
                  <div className="text-sm">Nothing planned for this day.</div>
                  <div className="text-xs text-bone-400/70 mt-1">
                    Click "Add task" to plan something
                  </div>
                </div>
              )}

              {selectedTasks.map((task) => {
                const isDone = task.status === 'DONE';
                return (
                  <motion.div
                    key={task.id}
                    layout
                    className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isDone
                        ? 'bg-white/[0.01] opacity-60'
                        : 'bg-white/[0.02] hover:bg-violet-500/[0.05]'
                    }`}
                  >
                    <button
                      onClick={() => toggle.mutate(task.id)}
                      className="flex-shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-cyan-300" />
                      ) : (
                        <Circle className="w-5 h-5 text-bone-400 hover:text-violet-300 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm ${
                          isDone
                            ? 'line-through text-bone-400'
                            : 'text-bone-50'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                        {task.subject && (
                          <>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${SUBJECT_COLOR(task.subject)}`}
                            />
                            <span className="text-bone-400">{task.subject}</span>
                            <span className="text-bone-400/40">·</span>
                          </>
                        )}
                        <Clock className="w-3 h-3 text-bone-400" />
                        <span className="text-bone-400 tabular-nums">
                          {task.durationMin}m
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${PRIORITY_TONE[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => remove.mutate(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-bone-400 hover:text-magenta-300 transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Add form */}
            <AnimatePresence>
              {adding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 rounded-xl bg-ink-950/40 border border-violet-500/30 space-y-3">
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="What needs to be done?"
                      autoFocus
                      className="w-full px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={form.subject}
                        onChange={(e) =>
                          setForm({ ...form, subject: e.target.value })
                        }
                        placeholder="Subject"
                        className="px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50"
                      />
                      <input
                        type="number"
                        min={5}
                        max={480}
                        value={form.durationMin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            durationMin: parseInt(e.target.value) || 30,
                          })
                        }
                        className="px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-xs text-bone-50 focus:outline-none focus:border-violet-500/50"
                      />
                      <select
                        value={form.priority}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                          })
                        }
                        className="px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-xs text-bone-50 focus:outline-none focus:border-violet-500/50"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAdding(false)}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-bone-300 text-sm hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => create.mutate()}
                        disabled={!form.title.trim() || create.isPending}
                        className="flex-1 py-2 rounded-lg bg-bone-50 text-ink-950 text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {create.isPending ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column — day stats */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-5">
              <div className="text-xs uppercase tracking-wider text-bone-400 mb-3">
                Day at a glance
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-display text-3xl text-bone-50 tabular-nums">
                    {completedToday}
                    <span className="text-bone-400 text-2xl">
                      /{selectedTasks.length}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-bone-400 mt-1">
                    Tasks done
                  </div>
                </div>
                <div>
                  <div className="font-display text-3xl text-bone-50 tabular-nums">
                    {completedMinutes}
                    <span className="text-bone-400 text-2xl">m</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-bone-400 mt-1">
                    Done time
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
                    style={{
                      width: `${
                        selectedTasks.length
                          ? (completedToday / selectedTasks.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-300" />
                <span className="text-xs uppercase tracking-wider text-violet-300">
                  Planner tips
                </span>
              </div>
              <ul className="space-y-2 text-sm text-bone-200">
                <li className="flex items-start gap-2">
                  <span className="text-violet-300 mt-0.5">→</span>
                  <span>Plan tomorrow before bed — frees mental load</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-300 mt-0.5">→</span>
                  <span>Schedule hard subjects when you're freshest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-300 mt-0.5">→</span>
                  <span>Two HIGH tasks per day, max — anything more is delusional</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-300" />
                <span className="text-xs uppercase tracking-wider text-bone-400">
                  This week
                </span>
              </div>
              <div className="font-display text-3xl text-bone-50 tabular-nums">
                {tasks.filter((t) => t.status === 'DONE').length}
                <span className="text-bone-400 text-2xl">/{tasks.length}</span>
              </div>
              <div className="text-xs text-bone-400 mt-1">
                tasks completed this week
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
