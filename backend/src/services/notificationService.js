import { prisma } from '../lib/prisma.js';

export const list = (userId) =>
  prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });

export const markRead = (userId, id) =>
  prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });

export const markAllRead = (userId) =>
  prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });

export const create = (userId, data) => prisma.notification.create({ data: { ...data, userId } });

export const unread = (userId) => prisma.notification.count({ where: { userId, read: false } });
