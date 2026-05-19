import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const list = (userId, q = {}) =>
  prisma.note.findMany({
    where: { userId, ...(q.q ? { OR: [
      { title: { contains: q.q, mode: 'insensitive' } },
      { content: { contains: q.q, mode: 'insensitive' } },
    ] } : {}) },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  });

export const create = (userId, data) => prisma.note.create({ data: { ...data, userId } });

export const update = async (userId, id, data) => {
  const n = await prisma.note.findUnique({ where: { id } });
  if (!n || n.userId !== userId) throw ApiError.notFound();
  return prisma.note.update({ where: { id }, data });
};

export const remove = async (userId, id) => {
  const n = await prisma.note.findUnique({ where: { id } });
  if (!n || n.userId !== userId) throw ApiError.notFound();
  await prisma.note.delete({ where: { id } });
  return { ok: true };
};
