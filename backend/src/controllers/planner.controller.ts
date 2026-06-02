import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { NotFound } from '../utils/errors.js';

// ─── Tasks ───────────────────────────────────────

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().max(60).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  durationMin: z.number().int().min(5).max(480).default(30),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subject: z.string().max(60).nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  status: z.enum(['PENDING', 'DONE', 'SKIPPED']).optional(),
  date: z.string().optional(),
});

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const listTasks = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { from, to, status } = req.query;

  const where: Record<string, unknown> = { userId };
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from as string) } : {}),
      ...(to ? { lte: new Date(to as string) } : {}),
    };
  }
  if (status) where.status = status;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ date: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    take: 200,
  });
  res.json({ ok: true, tasks });
};

export const listToday = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const today = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
  res.json({ ok: true, tasks });
};

export const createTask = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = createTaskSchema.parse(req.body);
  const task = await prisma.task.create({
    data: {
      userId,
      title: data.title,
      subject: data.subject,
      priority: data.priority,
      durationMin: data.durationMin,
      date: new Date(data.date),
    },
  });
  res.status(201).json({ ok: true, task });
};

export const updateTask = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = updateTaskSchema.parse(req.body);
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existing) throw NotFound('Task not found');

  const completedAt =
    data.status === 'DONE'
      ? new Date()
      : data.status
      ? null
      : undefined;

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...(data.title != null && { title: data.title }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.priority != null && { priority: data.priority }),
      ...(data.durationMin != null && { durationMin: data.durationMin }),
      ...(data.status != null && { status: data.status }),
      ...(data.date != null && { date: new Date(data.date) }),
      ...(completedAt !== undefined && { completedAt }),
    },
  });
  res.json({ ok: true, task });
};

export const toggleTask = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existing) throw NotFound('Task not found');
  const nextStatus = existing.status === 'DONE' ? 'PENDING' : 'DONE';
  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      status: nextStatus,
      completedAt: nextStatus === 'DONE' ? new Date() : null,
    },
  });
  res.json({ ok: true, task });
};

export const deleteTask = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existing) throw NotFound('Task not found');
  await prisma.task.delete({ where: { id: existing.id } });
  res.json({ ok: true });
};

// ─── Mood ────────────────────────────────────────

const moodSchema = z.object({
  mood: z.enum(['TERRIBLE', 'LOW', 'NEUTRAL', 'GOOD', 'GREAT']),
  note: z.string().max(500).optional(),
});

export const logMood = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = moodSchema.parse(req.body);
  const log = await prisma.moodLog.create({
    data: { userId, mood: data.mood, note: data.note },
  });
  res.status(201).json({ ok: true, log });
};

export const listMood = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const days = Math.min(Number(req.query.days || 30), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const logs = await prisma.moodLog.findMany({
    where: { userId, loggedAt: { gte: since } },
    orderBy: { loggedAt: 'desc' },
    take: 200,
  });
  res.json({ ok: true, logs });
};

export const todayMood = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const today = new Date();
  const log = await prisma.moodLog.findFirst({
    where: {
      userId,
      loggedAt: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    orderBy: { loggedAt: 'desc' },
  });
  res.json({ ok: true, log });
};

// ─── Upcoming exams ──────────────────────────────

export const upcomingExams = async (_req: Request, res: Response) => {
  const now = new Date();
  const exams = await prisma.exam.findMany({
    where: { startsAt: { gte: now } },
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      durationMin: true,
      totalMarks: true,
      _count: { select: { questions: true } },
    },
    orderBy: { startsAt: 'asc' },
    take: 5,
  });

  // Add `daysLeft` for client
  const enriched = exams.map((e) => ({
    ...e,
    daysLeft: e.startsAt
      ? Math.max(
          0,
          Math.ceil((e.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        )
      : null,
  }));

  res.json({ ok: true, exams: enriched });
};

// ─── Daily quote ─────────────────────────────────

const QUOTES = [
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'Do something today that your future self will thank you for.', author: 'Sean Patrick Flanery' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Small steps, every day. That is the only way.', author: 'Unknown' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'Knowledge is power, but enthusiasm pulls the switch.', author: 'Ivern Ball' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
];

export const dailyQuote = async (_req: Request, res: Response) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  const quote = QUOTES[day % QUOTES.length];
  res.json({ ok: true, quote });
};
