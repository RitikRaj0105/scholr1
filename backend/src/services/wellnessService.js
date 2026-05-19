import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { wellnessInsight, journalReflection } from '../ai/wellness.js';

export const logMood = (userId, data) => prisma.moodLog.create({ data: { ...data, userId } });

export const listMoods = (userId, days = 30) =>
  prisma.moodLog.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - days * 86400000) } },
    orderBy: { createdAt: 'asc' },
  });

export const insight = async (userId) => {
  const recent = await prisma.moodLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 14,
  });
  return wellnessInsight(recent);
};

export const listJournals = (userId) =>
  prisma.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

export const createJournal = async (userId, data) => {
  const ai = await journalReflection(data.content).catch(() => null);
  return prisma.journalEntry.create({ data: { ...data, userId, aiInsight: ai } });
};

export const removeJournal = async (userId, id) => {
  const j = await prisma.journalEntry.findUnique({ where: { id } });
  if (!j || j.userId !== userId) throw ApiError.notFound();
  await prisma.journalEntry.delete({ where: { id } });
  return { ok: true };
};
