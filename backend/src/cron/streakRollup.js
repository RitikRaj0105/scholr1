// Compute daily streaks for all users — wire into a node-cron, BullMQ, or Railway cron.
import { prisma } from '../lib/prisma.js';

export async function rollupStreaks() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    const logs = await prisma.productivityLog.findMany({
      where: { userId: u.id },
      orderBy: { date: 'desc' },
      take: 60,
    });
    let current = 0;
    let day = new Date(); day.setHours(0,0,0,0);
    for (const log of logs) {
      const d = new Date(log.date); d.setHours(0,0,0,0);
      if (d.getTime() === day.getTime() && log.focusMin > 0) {
        current += 1;
        day = new Date(day.getTime() - 86400000);
      } else { break; }
    }
    await prisma.user.update({
      where: { id: u.id },
      data: { streakCount: current, longestStreak: { set: undefined } },
    }).catch(()=>{});
  }
}
