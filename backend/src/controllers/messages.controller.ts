import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';

// ─── Conversations list (latest message per partner) ─────
export async function listConversations(req: Request, res: Response) {
  const me = req.user!.id;

  // Get all messages I'm part of, then group by partner
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, headline: true } },
      receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, headline: true } },
    },
  });

  // Group by the OTHER user. Keep only the latest message per conversation.
  const seen = new Set<string>();
  const conversations: any[] = [];
  for (const m of messages) {
    const otherUser = m.senderId === me ? m.receiver : m.sender;
    if (seen.has(otherUser.id)) continue;
    seen.add(otherUser.id);

    // Count unread from this partner
    const unread = await prisma.message.count({
      where: { senderId: otherUser.id, receiverId: me, read: false },
    });

    conversations.push({
      user: otherUser,
      lastMessage: { content: m.content, createdAt: m.createdAt, fromMe: m.senderId === me, read: m.read },
      unread,
    });
  }

  res.json({ conversations });
}

// ─── Thread with one user ───────────────────────────────
export async function getThread(req: Request, res: Response) {
  const me = req.user!.id;
  const otherId = req.params.userId;
  if (otherId === me) throw BadRequest('Cannot message yourself');

  // Check the other user isn't blocking me / I'm not blocking them
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: me, blockedId: otherId },
        { blockerId: otherId, blockedId: me },
      ],
    },
  });
  if (block) throw NotFound('Conversation not available');

  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, headline: true },
  });
  if (!other) throw NotFound('User not found');

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: otherId },
        { senderId: otherId, receiverId: me },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Mark unread messages from the other user as read
  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: me, read: false },
    data: { read: true },
  });

  res.json({ user: other, messages });
}

// ─── Send a message ────────────────────────────────────
const sendSchema = z.object({ content: z.string().min(1).max(2000) });

export async function sendMessage(req: Request, res: Response) {
  const me = req.user!.id;
  const otherId = req.params.userId;
  if (otherId === me) throw BadRequest('Cannot message yourself');

  const { content } = sendSchema.parse(req.body);

  // Block check both ways
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: me, blockedId: otherId },
        { blockerId: otherId, blockedId: me },
      ],
    },
  });
  if (block) throw Forbidden('Cannot send message');

  // Make sure other user exists
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true } });
  if (!other) throw NotFound('User not found');

  const message = await prisma.message.create({
    data: { senderId: me, receiverId: otherId, content: content.trim() },
  });

  // Notify the receiver
  await prisma.notification.create({
    data: {
      userId: otherId,
      fromUserId: me,
      type: 'CHAT',
      title: 'New message',
      body: content.slice(0, 100),
      link: `/dashboard/messages/${me}`,
    },
  }).catch(() => null);

  res.status(201).json({ message });
}

// ─── Unread count (for nav badge) ──────────────────────
export async function unreadCount(req: Request, res: Response) {
  const me = req.user!.id;
  const count = await prisma.message.count({
    where: { receiverId: me, read: false },
  });
  res.json({ count });
}

// ─── Delete a message (only your own, sender side) ─────
export async function deleteMessage(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;

  const msg = await prisma.message.findUnique({ where: { id } });
  if (!msg) throw NotFound('Message not found');
  if (msg.senderId !== me) throw Forbidden('Can only delete your own messages');

  await prisma.message.delete({ where: { id } });
  res.json({ ok: true });
}
