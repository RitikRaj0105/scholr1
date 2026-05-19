import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound, Conflict } from '../utils/errors.js';

// ─── Schemas ─────────────────────────────────────

const problemSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase-dashed only'),
  title: z.string().min(1).max(200),
  statement: z.string().min(10).max(50_000),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
  starterCode: z
    .record(z.string(), z.string())
    .refine((obj) => Object.keys(obj).length > 0, {
      message: 'At least one starter-code language is required',
    }),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional().default(false),
      })
    )
    .min(1)
    .max(50),
  timeLimitMs: z.number().int().min(100).max(60_000).default(2000),
  memoryLimitMb: z.number().int().min(16).max(1024).default(128),
});

const problemUpdateSchema = problemSchema.partial().omit({ slug: true });

// ─── Problems CRUD ───────────────────────────────

export const listProblems = async (_req: Request, res: Response) => {
  const problems = await prisma.codingProblem.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      tags: true,
      createdAt: true,
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ok: true, problems });
};

export const getProblem = async (req: Request, res: Response) => {
  const problem = await prisma.codingProblem.findUnique({
    where: { slug: req.params.slug },
  });
  if (!problem) throw NotFound('Problem not found');
  res.json({ ok: true, problem });
};

export const createProblem = async (req: Request, res: Response) => {
  const data = problemSchema.parse(req.body);

  const existing = await prisma.codingProblem.findUnique({
    where: { slug: data.slug },
  });
  if (existing) throw Conflict(`Problem with slug "${data.slug}" already exists`);

  const problem = await prisma.codingProblem.create({
    data: {
      slug: data.slug,
      title: data.title,
      statement: data.statement,
      difficulty: data.difficulty,
      tags: data.tags,
      starterCode: data.starterCode,
      testCases: data.testCases,
      timeLimitMs: data.timeLimitMs,
      memoryLimitMb: data.memoryLimitMb,
    },
  });
  res.status(201).json({ ok: true, problem });
};

export const updateProblem = async (req: Request, res: Response) => {
  const data = problemUpdateSchema.parse(req.body);
  const existing = await prisma.codingProblem.findUnique({
    where: { slug: req.params.slug },
  });
  if (!existing) throw NotFound('Problem not found');

  const problem = await prisma.codingProblem.update({
    where: { slug: req.params.slug },
    data,
  });
  res.json({ ok: true, problem });
};

export const deleteProblem = async (req: Request, res: Response) => {
  const existing = await prisma.codingProblem.findUnique({
    where: { slug: req.params.slug },
  });
  if (!existing) throw NotFound('Problem not found');
  await prisma.codingProblem.delete({ where: { slug: req.params.slug } });
  res.json({ ok: true });
};

// ─── Admin stats ─────────────────────────────────

export const getStats = async (_req: Request, res: Response) => {
  const [
    totalUsers,
    totalProblems,
    totalExams,
    totalSubmissions,
    totalCodeSubmissions,
    totalFocusSessions,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.codingProblem.count(),
    prisma.exam.count(),
    prisma.examAttempt.count(),
    prisma.codeSubmission.count(),
    prisma.focusSession.count(),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });
  const byRole: Record<string, number> = {};
  for (const r of usersByRole) byRole[r.role] = r._count;

  const problemsByDifficulty = await prisma.codingProblem.groupBy({
    by: ['difficulty'],
    _count: true,
  });
  const byDifficulty: Record<string, number> = {};
  for (const d of problemsByDifficulty) byDifficulty[d.difficulty] = d._count;

  res.json({
    ok: true,
    stats: {
      totalUsers,
      totalProblems,
      totalExams,
      totalSubmissions,
      totalCodeSubmissions,
      totalFocusSessions,
      byRole,
      byDifficulty,
      recentSignups,
    },
  });
};

// ─── Users (lightweight admin tools) ─────────────

const setRoleSchema = z.object({
  role: z.enum([
    'STUDENT',
    'TEACHER',
    'PARENT',
    'SCHOOL_ADMIN',
    'COLLEGE_ADMIN',
    'RECRUITER',
    'SUPER_ADMIN',
  ]),
});

const ADMIN_ROLES = ['SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'];

export const listUsers = async (req: Request, res: Response) => {
  const { role, search } = req.query;
  const users = await prisma.user.findMany({
    where: {
      ...(role
        ? { role: role as 'STUDENT' | 'TEACHER' | 'PARENT' | 'SCHOOL_ADMIN' | 'COLLEGE_ADMIN' | 'RECRUITER' | 'SUPER_ADMIN' }
        : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search as string, mode: 'insensitive' } },
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      subscriptionTier: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json({ ok: true, users });
};

export const setUserRole = async (req: Request, res: Response) => {
  const { role } = setRoleSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) throw NotFound('User not found');
  // Prevent admin from demoting themselves
  if (
    user.id === req.user!.id &&
    ADMIN_ROLES.includes(user.role) &&
    !ADMIN_ROLES.includes(role)
  ) {
    throw BadRequest('You cannot demote yourself from an admin role');
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role },
    select: { id: true, email: true, role: true },
  });
  res.json({ ok: true, user: updated });
};

// ─── Problem approval ────────────────────────────

export const listPendingProblems = async (_req: Request, res: Response) => {
  const problems = await prisma.codingProblem.findMany({
    where: { status: 'PENDING_REVIEW' },
    select: {
      id: true, slug: true, title: true, difficulty: true, status: true,
      tags: true, statement: true, testCases: true, starterCode: true,
      timeLimitMs: true, memoryLimitMb: true,
      createdAt: true,
      createdBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ ok: true, problems });
};

const reviewSchema = z.object({
  reviewNote: z.string().max(500).optional(),
});

export const approveProblem = async (req: Request, res: Response) => {
  const problem = await prisma.codingProblem.findUnique({ where: { slug: req.params.slug } });
  if (!problem) throw NotFound('Problem not found');
  if (problem.status !== 'PENDING_REVIEW') throw BadRequest('Problem is not pending review');

  const { reviewNote } = reviewSchema.parse(req.body);
  const updated = await prisma.codingProblem.update({
    where: { slug: req.params.slug },
    data: { status: 'APPROVED', reviewNote: reviewNote || 'Approved' },
  });
  res.json({ ok: true, problem: updated });
};

export const rejectProblem = async (req: Request, res: Response) => {
  const problem = await prisma.codingProblem.findUnique({ where: { slug: req.params.slug } });
  if (!problem) throw NotFound('Problem not found');
  if (problem.status !== 'PENDING_REVIEW') throw BadRequest('Problem is not pending review');

  const { reviewNote } = reviewSchema.parse(req.body);
  if (!reviewNote) throw BadRequest('A rejection reason is required');
  const updated = await prisma.codingProblem.update({
    where: { slug: req.params.slug },
    data: { status: 'REJECTED', reviewNote },
  });
  res.json({ ok: true, problem: updated });
};
