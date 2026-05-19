import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeUser } from './authService.js';

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true, achievements: { include: { achievement: true } } },
  });
  if (!user) throw ApiError.notFound('User not found');
  return sanitizeUser(user);
}

export async function updateProfile(userId, data) {
  if (data.username) {
    const existing = await prisma.user.findFirst({ where: { username: data.username, NOT: { id: userId } } });
    if (existing) throw ApiError.conflict('Username taken');
  }
  const user = await prisma.user.update({ where: { id: userId }, data });
  return sanitizeUser(user);
}

export async function getPreferences(userId) {
  let pref = await prisma.userPreference.findUnique({ where: { userId } });
  if (!pref) pref = await prisma.userPreference.create({ data: { userId } });
  return pref;
}

export async function updatePreferences(userId, data) {
  return prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function searchUsers(q, take = 10) {
  if (!q) return [];
  return prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    take,
    select: { id: true, username: true, name: true, avatar: true, level: true },
  });
}
