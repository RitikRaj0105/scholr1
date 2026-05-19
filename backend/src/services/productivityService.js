import { prisma } from '../lib/prisma.js';

export const last30 = async (userId) => {
  const since = new Date(Date.now() - 30 * 86400000);
  return prisma.productivityLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });
};

export const streaks = async (userId) => {
  const logs = await prisma.productivityLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 90,
  });
  let current = 0;
  let day = new Date(); day.setHours(0,0,0,0);
  for (const log of logs) {
    const d = new Date(log.date); d.setHours(0,0,0,0);
    if (d.getTime() === day.getTime() && log.focusMin > 0) {
      current += 1;
      day = new Date(day.getTime() - 86400000);
    } else if (d.getTime() < day.getTime()) {
      break;
    }
  }
  await prisma.user.update({
    where: { id: userId },
    data: { streakCount: current, longestStreak: { set: undefined } },
  }).catch(()=>{});
  return { current, logs: logs.length };
};
