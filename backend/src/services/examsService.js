import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const list = (userId) =>
  prisma.exam.findMany({ where: { userId }, orderBy: { date: 'asc' } });

export const upcoming = (userId) =>
  prisma.exam.findMany({
    where: { userId, date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    take: 5,
  });

export const create = (userId, data) =>
  prisma.exam.create({ data: { ...data, userId, date: new Date(data.date) } });

export const update = async (userId, id, data) => {
  const e = await prisma.exam.findUnique({ where: { id } });
  if (!e || e.userId !== userId) throw ApiError.notFound();
  return prisma.exam.update({ where: { id }, data: { ...data, date: data.date ? new Date(data.date) : e.date } });
};

export const remove = async (userId, id) => {
  const e = await prisma.exam.findUnique({ where: { id } });
  if (!e || e.userId !== userId) throw ApiError.notFound();
  await prisma.exam.delete({ where: { id } });
  return { ok: true };
};
