import { prisma } from '../lib/prisma.js';

export const lessons = (category) =>
  prisma.lifeSkillLesson.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });

export const myProgress = (userId) =>
  prisma.lifeSkillProgress.findMany({
    where: { userId },
    include: { lesson: true },
    orderBy: { createdAt: 'desc' },
  });

export const complete = async (userId, lessonId) => {
  const lesson = await prisma.lifeSkillLesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return null;
  const progress = await prisma.lifeSkillProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: new Date() },
  });
  await prisma.user.update({ where: { id: userId }, data: { xp: { increment: lesson.xpReward } } });
  return progress;
};
