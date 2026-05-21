import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const listNotifications = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const cursor = (req.query.cursor as string) || undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '30'), 100);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    include: {
      fromUser: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > limit;
  const items = notifications.slice(0, limit);

  res.json({
    ok: true,
    notifications: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
};

export const unreadCount = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const count = await prisma.notification.count({
    where: { userId, read: false },
  });
  res.json({ ok: true, count });
};

export const markRead = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId },
    data: { read: true },
  });
  res.json({ ok: true });
};

export const markAllRead = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
};

export const deleteNotification = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await prisma.notification.deleteMany({
    where: { id: req.params.id, userId },
  });
  res.json({ ok: true });
};
