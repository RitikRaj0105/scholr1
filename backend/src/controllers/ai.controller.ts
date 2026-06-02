import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import {
  streamCompletion,
  type MentorMode,
  type ChatMsg,
  explainTopic,
  generatePracticeQuiz,
  generateLessonPlan,
  evaluateDescriptiveAnswer,
  getClassroomAIAnalytics
} from '../services/ai.service.js';
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

export const explainTopicHandler = async (req: Request, res: Response) => {
  const schema = z.object({
    topic: z.string().min(1),
    depth: z.enum(['brief', 'detailed']).default('brief'),
  });
  const data = schema.parse(req.body);
  const result = await explainTopic(data.topic, data.depth);
  res.json({ ok: true, ...result });
};

export const generateQuizHandler = async (req: Request, res: Response) => {
  const schema = z.object({
    topic: z.string().min(1),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    count: z.number().int().min(1).max(20).default(5),
  });
  const data = schema.parse(req.body);
  const result = await generatePracticeQuiz(data.topic, data.difficulty, data.count);
  res.json({ ok: true, ...result });
};

export const generateLessonPlanHandler = async (req: Request, res: Response) => {
  const schema = z.object({
    subject: z.string().min(1),
    topic: z.string().min(1),
    syllabus: z.string().min(1),
    targetDurationMinutes: z.number().int().min(5).max(300).default(60),
  });
  const data = schema.parse(req.body);
  const result = await generateLessonPlan(data.subject, data.topic, data.syllabus, data.targetDurationMinutes);
  res.json({ ok: true, ...result });
};

export const evaluateDescriptiveAnswerHandler = async (req: Request, res: Response) => {
  const schema = z.object({
    questionPrompt: z.string().min(1),
    studentAnswer: z.string().min(1),
    sampleSolution: z.string().nullable().optional(),
  });
  const data = schema.parse(req.body);
  const result = await evaluateDescriptiveAnswer(
    data.questionPrompt,
    data.studentAnswer,
    data.sampleSolution || null
  );
  res.json({ ok: true, ...result });
};

export const getClassroomAIAnalyticsHandler = async (req: Request, res: Response) => {
  const classroomId = req.query.classroomId as string;
  if (!classroomId) {
    throw new Error('classroomId query parameter is required');
  }
  const result = await getClassroomAIAnalytics(classroomId);
  res.json({ ok: true, ...result });
};
