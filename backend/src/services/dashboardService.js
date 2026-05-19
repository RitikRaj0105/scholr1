import { prisma } from '../lib/prisma.js';
import { sanitizeUser } from './authService.js';

export const overview = async (userId) => {
  const [user, tasks, focus, exams, mood, productivityLogs, achievements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.task.findMany({ where: { userId }, orderBy: { dueAt: 'asc' }, take: 6 }),
    prisma.focusSession.findMany({
      where: { userId, startedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      orderBy: { startedAt: 'asc' },
    }),
    prisma.exam.findMany({ where: { userId, date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 4 }),
    prisma.moodLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 7 }),
    prisma.productivityLog.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 14 * 86400000) } },
      orderBy: { date: 'asc' },
    }),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, take: 8 }),
  ]);

  const focusToday = focus.filter((s) => sameDay(s.startedAt)).reduce((a, s) => a + (s.actualMin || 0), 0);
  const tasksDoneToday = tasks.filter((t) => t.completedAt && sameDay(t.completedAt)).length;
  const focusScore = computeFocusScore(focus);
  return {
    user: sanitizeUser(user),
    focusToday,
    tasksDoneToday,
    focusScore,
    upcomingExams: exams,
    todoSnapshot: tasks,
    moodTrend: mood.reverse(),
    productivity: productivityLogs,
    achievements,
  };
};

function sameDay(d) {
  const a = new Date(d); const b = new Date();
  return a.toDateString() === b.toDateString();
}

function computeFocusScore(sessions) {
  if (!sessions.length) return 0;
  const total = sessions.reduce((a, s) => a + (s.actualMin || 0), 0);
  const planned = sessions.reduce((a, s) => a + (s.plannedMin || 0), 0) || 1;
  return Math.min(100, Math.round((total / planned) * 100));
}
