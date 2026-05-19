import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
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

const PRIORITY_TONE = {
  HIGH: 'text-magenta-300 bg-magenta-500/10',
  MEDIUM: 'text-violet-300 bg-violet-500/10',
  LOW: 'text-cyan-300 bg-cyan-500/10',
};

const SUBJECT_DOT_COLOR = (s: string | null) => {
  if (!s) return 'bg-bone-400';
  const map: Record<string, string> = {
    physics: 'bg-violet-400',
    chemistry: 'bg-magenta-400',
    math: 'bg-cyan-400',
    mathematics: 'bg-cyan-400',
    biology: 'bg-green-400',
    english: 'bg-orange-400',
    history: 'bg-amber-400',
    cs: 'bg-violet-400',
    coding: 'bg-violet-400',
  };
  return map[s.toLowerCase()] || 'bg-bone-400';
};

export const TodayTasks = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(
    'MEDIUM'
  );

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks-today'],
    queryFn: async () => (await api.get('/planner/tasks/today')).data.tasks,
  });

  const toggle = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/planner/tasks/${id}/toggle`)).data.task,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks-today'] });
      const prev = qc.getQueryData<Task[]>(['tasks-today']);
      qc.setQueryData<Task[]>(['tasks-today'], (old = []) =>
        old.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'DONE' ? 'PENDING' : 'DONE' }
            : t
        )
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks-today'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks-today'] }),
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/planner/tasks', {
          title: newTitle,
          subject: newSubject || undefined,
          priority: newPriority,
          durationMin: newDuration,
          date: new Date().toISOString().slice(0, 10),
        })
      ).data.task,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks-today'] });
      setAdding(false);
      setNewTitle('');
      setNewSubject('');
      setNewDuration(30);
      setNewPriority('MEDIUM');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/planner/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks-today'] });
      const prev = qc.getQueryData<Task[]>(['tasks-today']);
      qc.setQueryData<Task[]>(['tasks-today'], (old = []) =>
        old.filter((t) => t.id !== id)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks-today'], ctx.prev);
    },
  });

  const done = tasks.filter((t) => t.status === 'DONE').length;
  const total = tasks.length;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-display text-xl text-bone-50">Today's tasks</div>
          <div className="text-xs text-bone-400 mt-0.5">
            {done} of {total} completed
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/planner')}
          className="text-sm text-violet-300 hover:text-violet-200 flex items-center gap-1"
        >
          Planner <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
        />
      </div>

      <div className="space-y-2">
        {isLoading && (
          <div className="text-sm text-bone-400 py-3">Loading tasks…</div>
        )}
        {!isLoading && tasks.length === 0 && !adding && (
          <div className="text-sm text-bone-400 py-3 text-center">
            No tasks for today. Add one below.
          </div>
        )}
        {tasks.map((task) => {
          const isDone = task.status === 'DONE';
          return (
            <div
              key={task.id}
              className={`group flex items-start gap-3 p-3 rounded-xl transition-all ${
                isDone
                  ? 'bg-white/[0.01] opacity-60'
                  : 'bg-white/[0.02] hover:bg-violet-500/[0.05]'
              }`}
            >
              <button
                onClick={() => toggle.mutate(task.id)}
                className="mt-0.5 flex-shrink-0"
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
                        className={`w-1.5 h-1.5 rounded-full ${SUBJECT_DOT_COLOR(
                          task.subject
                        )}`}
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
                    className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wider ${PRIORITY_TONE[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove.mutate(task.id)}
                className="opacity-0 group-hover:opacity-100 text-bone-400 hover:text-magenta-300 transition-all"
                title="Delete"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline add */}
      {adding ? (
        <div className="mt-3 p-3 rounded-xl bg-ink-950/40 border border-violet-500/30 space-y-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title…"
            autoFocus
            className="w-full px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject"
              className="px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-xs text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50"
            />
            <input
              type="number"
              min={5}
              max={480}
              value={newDuration}
              onChange={(e) => setNewDuration(parseInt(e.target.value) || 30)}
              className="px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-xs text-bone-50 focus:outline-none focus:border-violet-500/50"
            />
            <select
              value={newPriority}
              onChange={(e) =>
                setNewPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
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
              disabled={!newTitle.trim() || create.isPending}
              className="flex-1 py-2 rounded-lg bg-bone-50 text-ink-950 text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {create.isPending ? 'Adding…' : 'Add task'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-bone-400 hover:text-violet-300 hover:bg-violet-500/5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add task
        </button>
      )}
    </div>
  );
};
