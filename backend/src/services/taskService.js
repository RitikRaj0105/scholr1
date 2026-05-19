import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const list = (userId, q = {}) =>
  prisma.task.findMany({
    where: {
      userId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.studyPlanId ? { studyPlanId: q.studyPlanId } : {}),
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
  });

export const create = (userId, data) =>
  prisma.task.create({ data: { ...data, userId, dueAt: data.dueAt ? new Date(data.dueAt) : null } });

export const update = async (userId, id, data) => {
  const t = await prisma.task.findUnique({ where: { id } });
  if (!t || t.userId !== userId) throw ApiError.notFound('Task not found');
  const completedAt = data.status === 'DONE' ? new Date() : data.status ? null : t.completedAt;
  return prisma.task.update({
    where: { id },
    data: { ...data, dueAt: data.dueAt ? new Date(data.dueAt) : data.dueAt === null ? null : t.dueAt, completedAt },
  });
};

export const remove = async (userId, id) => {
  const t = await prisma.task.findUnique({ where: { id } });
  if (!t || t.userId !== userId) throw ApiError.notFound('Task not found');
  await prisma.task.delete({ where: { id } });
  return { ok: true };
};

export const summary = async (userId) => {
  const [pending, done, overdue] = await Promise.all([
    prisma.task.count({ where: { userId, status: 'PENDING' } }),
    prisma.task.count({ where: { userId, status: 'DONE' } }),
    prisma.task.count({ where: { userId, status: { not: 'DONE' }, dueAt: { lt: new Date() } } }),
  ]);
  return { pending, done, overdue };
};
