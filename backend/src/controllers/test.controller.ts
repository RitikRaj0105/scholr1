import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { generateExam } from '../services/ai.service.js';
import { BadRequest, NotFound } from '../utils/errors.js';

const generateSchema = z.object({
  subject: z.string().min(1).max(100),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  count: z.number().int().min(1).max(30).default(10),
  type: z.enum(['MCQ', 'MIXED']).default('MCQ'),
  durationMin: z.number().int().min(5).max(240).default(30),
  examType: z.enum(['SCHOOL', 'COLLEGE', 'COMPETITIVE', 'CODING', 'APTITUDE', 'MOCK', 'CUSTOM']).default('CUSTOM'),
});

const submitSchema = z.object({
  answers: z.record(z.string(), z.any()),
});

export const listExams = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { type, classroomId } = req.query;
  const exams = await prisma.exam.findMany({
    where: {
      ...(type ? { type: type as 'SCHOOL' | 'COLLEGE' | 'COMPETITIVE' | 'CODING' | 'APTITUDE' | 'MOCK' | 'CUSTOM' } : {}),
      ...(classroomId ? { classroomId: classroomId as string } : {}),
    },
    select: {
      id: true,
      title: true,
      type: true,
      durationMin: true,
      totalMarks: true,
      generatedByAI: true,
      createdAt: true,
      _count: { select: { questions: true, attempts: true } },
      attempts: {
        where: { userId },
        select: { score: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ ok: true, exams });
};

export const getStats = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const attempts = await prisma.examAttempt.findMany({
    where: { userId, submittedAt: { not: null } },
    include: {
      exam: { select: { id: true, title: true, type: true, totalMarks: true } },
    },
    orderBy: { submittedAt: 'asc' },
  });

  const totalAttempts = attempts.length;
  const examsAttempted = new Set(attempts.map((a) => a.examId)).size;
  const totalExams = await prisma.exam.count();

  const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalPossible = attempts.reduce((sum, a) => sum + (a.exam.totalMarks || 0), 0);
  const averagePercentage =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  // Best per-attempt percentage
  const bestPercentage = attempts.reduce((best, a) => {
    const pct =
      a.exam.totalMarks > 0
        ? Math.round(((a.score || 0) / a.exam.totalMarks) * 100)
        : 0;
    return pct > best ? pct : best;
  }, 0);

  // Score timeline — last 14 attempts
  const timeline = attempts.slice(-14).map((a) => ({
    date: a.submittedAt?.toISOString().slice(0, 10) ?? '',
    score:
      a.exam.totalMarks > 0
        ? Math.round(((a.score || 0) / a.exam.totalMarks) * 100)
        : 0,
    title: a.exam.title,
  }));

  // Mastery by exam type
  const byType: Record<string, { count: number; total: number; possible: number }> = {};
  for (const a of attempts) {
    const t = a.exam.type;
    if (!byType[t]) byType[t] = { count: 0, total: 0, possible: 0 };
    byType[t].count++;
    byType[t].total += a.score || 0;
    byType[t].possible += a.exam.totalMarks || 0;
  }
  const masteryByType = Object.entries(byType).map(([type, v]) => ({
    type,
    percentage: v.possible > 0 ? Math.round((v.total / v.possible) * 100) : 0,
    count: v.count,
  }));

  // Trend — compare last 5 vs previous 5
  const recent = attempts.slice(-5);
  const previous = attempts.slice(-10, -5);
  const avg = (arr: typeof attempts) => {
    if (!arr.length) return 0;
    const s = arr.reduce((sum, a) => sum + (a.score || 0), 0);
    const p = arr.reduce((sum, a) => sum + (a.exam.totalMarks || 0), 0);
    return p > 0 ? Math.round((s / p) * 100) : 0;
  };
  const recentAvg = avg(recent);
  const previousAvg = avg(previous);
  const trend = recentAvg - previousAvg;

  res.json({
    ok: true,
    stats: {
      totalExams,
      examsAttempted,
      totalAttempts,
      averagePercentage,
      bestPercentage,
      trend,
      timeline,
      masteryByType,
    },
  });
};

export const getExam = async (req: Request, res: Response) => {
  const exam = await prisma.exam.findUnique({
    where: { id: req.params.id },
    include: {
      questions: {
        select: {
          id: true,
          type: true,
          difficulty: true,
          prompt: true,
          options: true,
          marks: true,
          topic: true,
        },
      },
    },
  });
  if (!exam) throw NotFound('Exam not found');
  res.json({ ok: true, exam });
};

export const generate = async (req: Request, res: Response) => {
  const data = generateSchema.parse(req.body);

  const generated = await generateExam({
    subject: data.subject,
    difficulty: data.difficulty,
    count: data.count,
    type: data.type,
  });

  if (!generated?.questions || !Array.isArray(generated.questions)) {
    throw BadRequest('AI returned malformed exam');
  }

  const exam = await prisma.exam.create({
    data: {
      title: generated.title ?? `${data.subject} — ${data.difficulty}`,
      type: data.examType,
      durationMin: data.durationMin,
      totalMarks: generated.questions.reduce((sum: number, q: { marks?: number }) => sum + (q.marks ?? 1), 0),
      generatedByAI: true,
      questions: {
        create: generated.questions.map((q: {
          type?: string;
          prompt: string;
          options?: string[] | null;
          correctAnswer: string;
          explanation?: string;
          marks?: number;
          topic?: string;
        }) => ({
          type: q.type === 'DESCRIPTIVE' ? 'DESCRIPTIVE' : 'MCQ',
          difficulty: data.difficulty,
          prompt: q.prompt,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          marks: q.marks ?? 1,
          topic: q.topic,
        })),
      },
    },
    include: { questions: true },
  });

  res.status(201).json({ ok: true, exam });
};

export const submit = async (req: Request, res: Response) => {
  const data = submitSchema.parse(req.body);

  const exam = await prisma.exam.findUnique({
    where: { id: req.params.id },
    include: { questions: { orderBy: { id: 'asc' } } },
  });
  if (!exam) throw NotFound('Exam not found');

  // Auto-grade MCQs + assemble review payload
  let score = 0;
  const gradedQuestions = exam.questions.map((q) => {
    const userAnswer = data.answers[q.id] ?? null;
    const isCorrect =
      q.type === 'MCQ' &&
      userAnswer != null &&
      q.correctAnswer != null &&
      userAnswer === q.correctAnswer;
    if (isCorrect) score += q.marks;
    return {
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      marks: q.marks,
      userAnswer,
      isCorrect,
    };
  });

  const attempt = await prisma.examAttempt.create({
    data: {
      examId: exam.id,
      userId: req.user!.id,
      answers: data.answers,
      score,
      submittedAt: new Date(),
    },
  });

  res.status(201).json({
    ok: true,
    attempt: {
      id: attempt.id,
      score,
      totalMarks: exam.totalMarks,
      percentage:
        exam.totalMarks > 0 ? Math.round((score / exam.totalMarks) * 100) : 0,
    },
    questions: gradedQuestions,
  });
};
