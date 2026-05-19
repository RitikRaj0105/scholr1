import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { NotFound } from '../utils/errors.js';

const startSchema = z.object({
  type: z.enum(['POMODORO', 'DEEP_WORK', 'STUDY_BLOCK', 'CUSTOM']).default('POMODORO'),
  plannedMin: z.number().int().min(1).max(480),
  subject: z.string().max(80).optional(),
  blockedApps: z.array(z.string()).max(50).optional(),
});

const endSchema = z.object({
  actualMin: z.number().int().min(0).max(480),
  distractions: z.number().int().min(0).default(0),
  status: z.enum(['COMPLETED', 'ABANDONED']).default('COMPLETED'),
  notes: z.string().max(500).optional(),
});

export const startSession = async (req: Request, res: Response) => {
  const data = startSchema.parse(req.body);
  const session = await prisma.focusSession.create({
    data: {
      userId: req.user!.id,
      type: data.type,
      plannedMin: data.plannedMin,
      subject: data.subject,
      blockedApps: data.blockedApps ?? [],
      status: 'ACTIVE',
    },
  });
  res.status(201).json({ ok: true, session });
};

export const endSession = async (req: Request, res: Response) => {
  const data = endSchema.parse(req.body);

  const existing = await prisma.focusSession.findFirst({
    where: { id: req.params.id, userId: req.user!.id, status: 'ACTIVE' },
  });
  if (!existing) throw NotFound('Active session not found');

  const session = await prisma.focusSession.update({
    where: { id: existing.id },
    data: {
      actualMin: data.actualMin,
      distractions: data.distractions,
      status: data.status,
      notes: data.notes,
      endedAt: new Date(),
    },
  });

  // Update streak on successful completion (>= 50% of planned)
  if (data.status === 'COMPLETED' && data.actualMin >= existing.plannedMin / 2) {
    await updateStreak(req.user!.id);
  }

  res.json({ ok: true, session });
};

export const listSessions = async (req: Request, res: Response) => {
  const sessions = await prisma.focusSession.findMany({
    where: { userId: req.user!.id },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });
  res.json({ ok: true, sessions });
};

export const stats = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [todayAgg, weekAgg, totalAgg, streak] = await Promise.all([
    prisma.focusSession.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: { gte: startOfDay(now) },
      },
      _sum: { actualMin: true },
      _count: true,
    }),
    prisma.focusSession.aggregate({
      where: { userId, status: 'COMPLETED', startedAt: { gte: weekStart } },
      _sum: { actualMin: true },
      _count: true,
    }),
    prisma.focusSession.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { actualMin: true },
      _count: true,
    }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);

  // Per-day breakdown for the last 7 days (for heatmap / chart)
  const recent = await prisma.focusSession.findMany({
    where: { userId, status: 'COMPLETED', startedAt: { gte: weekStart } },
    select: { startedAt: true, actualMin: true },
  });

  const byDay: Record<string, number> = {};
  for (const s of recent) {
    const key = s.startedAt.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] ?? 0) + (s.actualMin ?? 0);
  }

  res.json({
    ok: true,
    stats: {
      today: { minutes: todayAgg._sum.actualMin ?? 0, sessions: todayAgg._count },
      week: { minutes: weekAgg._sum.actualMin ?? 0, sessions: weekAgg._count },
      total: { minutes: totalAgg._sum.actualMin ?? 0, sessions: totalAgg._count },
      streak: streak ? { current: streak.current, longest: streak.longest } : { current: 0, longest: 0 },
      byDay,
    },
  });
};

// ---------- helpers ----------

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const updateStreak = async (userId: string) => {
  const streak = await prisma.streak.upsert({
    where: { userId },
    create: { userId, current: 1, longest: 1, lastActiveAt: new Date() },
    update: {}, // we'll compute below
  });

  const today = startOfDay(new Date());
  const last = streak.lastActiveAt ? startOfDay(streak.lastActiveAt) : null;

  if (last && last.getTime() === today.getTime()) {
    // already counted today
    return;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const continued = last && last.getTime() === yesterday.getTime();
  const next = continued ? streak.current + 1 : 1;

  await prisma.streak.update({
    where: { userId },
    data: {
      current: next,
      longest: Math.max(next, streak.longest),
      lastActiveAt: new Date(),
    },
  });
};
