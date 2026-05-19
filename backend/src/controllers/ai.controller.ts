import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { streamCompletion, type MentorMode, type ChatMsg } from '../services/ai.service.js';
import { NotFound } from '../utils/errors.js';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(8000),
  mode: z.enum(['general', 'study', 'career', 'wellness', 'coding']).default('general'),
});

const createChatSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  context: z.string().max(50).optional(),
});

export const listChats = async (req: Request, res: Response) => {
  const chats = await prisma.aIChat.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      context: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
    take: 50,
  });
  res.json({ ok: true, chats });
};

export const getChat = async (req: Request, res: Response) => {
  const chat = await prisma.aIChat.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!chat) throw NotFound('Chat not found');
  res.json({ ok: true, chat });
};

export const createChat = async (req: Request, res: Response) => {
  const data = createChatSchema.parse(req.body);
  const chat = await prisma.aIChat.create({
    data: {
      userId: req.user!.id,
      title: data.title ?? 'New chat',
      context: data.context,
    },
  });
  res.status(201).json({ ok: true, chat });
};

export const deleteChat = async (req: Request, res: Response) => {
  await prisma.aIChat.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.json({ ok: true });
};

/**
 * SSE streaming endpoint.
 *
 *   POST /api/ai/chat/:id/messages    { content, mode }
 *
 * Response: text/event-stream — events are { type: 'delta' | 'done' | 'error', ... }
 */
export const sendMessage = async (req: Request, res: Response) => {
  const data = sendMessageSchema.parse(req.body);
  const chatId = req.params.id;

  const chat = await prisma.aIChat.findFirst({
    where: { id: chatId, userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 30 } },
  });
  if (!chat) throw NotFound('Chat not found');

  // Persist the user message first
  await prisma.aIMessage.create({
    data: { chatId, role: 'user', content: data.content },
  });

  // Build history for the model
  const history: ChatMsg[] = [
    ...chat.messages.map((m) => ({
      role: m.role as ChatMsg['role'],
      content: m.content,
    })),
    { role: 'user', content: data.content },
  ];

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders?.();

  const write = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  let fullText = '';
  try {
    for await (const delta of streamCompletion(history, data.mode as MentorMode)) {
      fullText += delta;
      write({ type: 'delta', content: delta });
    }

    await prisma.aIMessage.create({
      data: { chatId, role: 'assistant', content: fullText },
    });
    await prisma.aIChat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    write({ type: 'done' });
  } catch (err) {
    write({
      type: 'error',
      message: (err as Error).message ?? 'AI generation failed',
    });
  } finally {
    res.end();
  }
};
