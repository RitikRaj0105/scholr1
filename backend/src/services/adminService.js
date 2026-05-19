import { prisma } from '../lib/prisma.js';

export const stats = async () => {
  const [users, sessions, focus, ai, listings] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({ where: { revokedAt: null } }),
    prisma.focusSession.count(),
    prisma.aIMessage.count(),
    prisma.marketplaceListing.count(),
  ]);
  return { users, activeSessions: sessions, focusSessions: focus, aiMessages: ai, listings };
};

export const listUsers = (q = {}) =>
  prisma.user.findMany({
    where: q.q ? {
      OR: [
        { email: { contains: q.q, mode: 'insensitive' } },
        { username: { contains: q.q, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, email: true, username: true, name: true, role: true, isActive: true, xp: true, level: true, createdAt: true },
  });

export const setUserRole = (id, role) => prisma.user.update({ where: { id }, data: { role } });
export const toggleActive = (id, isActive) => prisma.user.update({ where: { id }, data: { isActive } });

export const moderateListing = (id, approved) =>
  prisma.marketplaceListing.update({ where: { id }, data: { approved } });
