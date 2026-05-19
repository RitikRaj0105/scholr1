import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const startSession = (userId, data) =>
  prisma.focusSession.create({
    data: {
      userId,
      mode: data.mode,
      plannedMin: data.plannedMin,
      notes: data.notes,
      status: 'ACTIVE',
    },
  });

export const updateSession = async (userId, id, data) => {
  const s = await prisma.focusSession.findUnique({ where: { id } });
  if (!s || s.userId !== userId) throw ApiError.notFound();
  const endedAt = data.status === 'COMPLETED' || data.status === 'ABANDONED' ? new Date() : s.endedAt;
  const session = await prisma.focusSession.update({
    where: { id },
    data: { ...data, endedAt },
  });
  if (session.status === 'COMPLETED') {
    await rollupDay(userId, session);
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: Math.round(session.actualMin / 5) } },
    });
  }
  return session;
};

async function rollupDay(userId, session) {
  const date = new Date(session.startedAt);
  date.setHours(0, 0, 0, 0);
  await prisma.productivityLog.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId, date,
      focusMin: session.actualMin,
      score: Math.min(100, session.productivity || (session.actualMin / Math.max(1, session.plannedMin)) * 100),
      xpEarned: Math.round(session.actualMin / 5),
    },
    update: {
      focusMin: { increment: session.actualMin },
      xpEarned: { increment: Math.round(session.actualMin / 5) },
      score: Math.min(100, session.productivity || 70),
    },
  });
}

export const list = (userId, take = 30) =>
  prisma.focusSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take,
  });

export const analytics = async (userId) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sessions = await prisma.focusSession.findMany({
    where: { userId, startedAt: { gte: since } },
    orderBy: { startedAt: 'asc' },
  });
  const totalMin = sessions.reduce((a, s) => a + (s.actualMin || 0), 0);
  const avgScore = sessions.length
    ? sessions.reduce((a, s) => a + (s.productivity || 0), 0) / sessions.length
    : 0;
  return {
    totalSessions: sessions.length,
    totalMin,
    avgScore: Math.round(avgScore),
    sessions: sessions.map((s) => ({
      id: s.id,
      day: s.startedAt.toISOString().slice(0, 10),
      actualMin: s.actualMin,
      productivity: s.productivity,
      mode: s.mode,
      status: s.status,
    })),
  };
};

export const listBlocked = (userId) =>
  prisma.blockedSite.findMany({ where: { userId }, orderBy: { domain: 'asc' } });

export const addBlocked = (userId, data) =>
  prisma.blockedSite.upsert({
    where: { userId_domain: { userId, domain: data.domain.toLowerCase() } },
    create: { ...data, domain: data.domain.toLowerCase(), userId },
    update: data,
  });

export const removeBlocked = async (userId, id) => {
  const b = await prisma.blockedSite.findUnique({ where: { id } });
  if (!b || b.userId !== userId) throw ApiError.notFound();
  await prisma.blockedSite.delete({ where: { id } });
  return { ok: true };
};

export const recordHit = async (userId, focusSessionId, domain) => {
  const session = await prisma.focusSession.findUnique({ where: { id: focusSessionId } });
  if (!session || session.userId !== userId) throw ApiError.notFound();
  return prisma.blockedHit.create({ data: { focusSessionId, domain } });
};

export const seedDefaults = async (userId) => {
  const defaults = ['instagram.com', 'tiktok.com', 'youtube.com', 'facebook.com', 'discord.com', 'snapchat.com', 'twitter.com', 'x.com', 'reddit.com'];
  for (const d of defaults) {
    await prisma.blockedSite.upsert({
      where: { userId_domain: { userId, domain: d } },
      create: { userId, domain: d, category: 'social' },
      update: {},
    });
  }
  return listBlocked(userId);
};
