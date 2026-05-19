import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';

// ─── Helpers ─────────────────────────────────────

/** 6-char alphanumeric join code (uppercase, no ambiguous chars) */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function uniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateJoinCode();
    const existing = await prisma.classroom.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error('Could not generate unique join code');
}

// ─── Schemas ─────────────────────────────────────

const createClassroomSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  subject: z.string().max(60).optional(),
});

const updateClassroomSchema = createClassroomSchema.partial();

// ─── Stats ───────────────────────────────────────

export const getTeacherStats = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;

  const [classrooms, totalStudents] = await Promise.all([
    prisma.classroom.findMany({
      where: { teacherId },
      select: {
        id: true,
        name: true,
        subject: true,
        code: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.enrollment.count({
      where: { classroom: { teacherId } },
    }),
  ]);

  // Recent enrollments across all classrooms
  const recentEnrollments = await prisma.enrollment.findMany({
    where: { classroom: { teacherId } },
    select: {
      id: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      classroom: {
        select: { id: true, name: true },
      },
    },
    orderBy: { joinedAt: 'desc' },
    take: 10,
  });

  res.json({
    ok: true,
    stats: {
      totalClassrooms: classrooms.length,
      totalStudents,
      classrooms,
      recentEnrollments,
    },
  });
};

// ─── Classrooms CRUD ─────────────────────────────

export const listClassrooms = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    select: {
      id: true,
      name: true,
      description: true,
      subject: true,
      code: true,
      createdAt: true,
      _count: { select: { enrollments: true, assignments: true, exams: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ok: true, classrooms });
};

export const getClassroom = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const classroom = await prisma.classroom.findUnique({
    where: { id: req.params.id },
    include: {
      enrollments: {
        select: {
          id: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
      _count: { select: { assignments: true, exams: true } },
    },
  });
  if (!classroom) throw NotFound('Classroom not found');
  if (classroom.teacherId !== teacherId) throw Forbidden('Not your classroom');
  res.json({ ok: true, classroom });
};

export const createClassroom = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const data = createClassroomSchema.parse(req.body);
  const code = await uniqueJoinCode();
  const classroom = await prisma.classroom.create({
    data: {
      teacherId,
      name: data.name,
      description: data.description,
      subject: data.subject,
      code,
    },
  });
  res.status(201).json({ ok: true, classroom });
};

export const updateClassroom = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const data = updateClassroomSchema.parse(req.body);
  const existing = await prisma.classroom.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw NotFound('Classroom not found');
  if (existing.teacherId !== teacherId) throw Forbidden('Not your classroom');
  const classroom = await prisma.classroom.update({
    where: { id: existing.id },
    data,
  });
  res.json({ ok: true, classroom });
};

export const regenerateCode = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const existing = await prisma.classroom.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw NotFound('Classroom not found');
  if (existing.teacherId !== teacherId) throw Forbidden('Not your classroom');
  const code = await uniqueJoinCode();
  const classroom = await prisma.classroom.update({
    where: { id: existing.id },
    data: { code },
  });
  res.json({ ok: true, classroom });
};

export const deleteClassroom = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const existing = await prisma.classroom.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw NotFound('Classroom not found');
  if (existing.teacherId !== teacherId) throw Forbidden('Not your classroom');
  await prisma.classroom.delete({ where: { id: existing.id } });
  res.json({ ok: true });
};

export const removeStudent = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: req.params.enrollmentId },
    include: { classroom: { select: { teacherId: true } } },
  });
  if (!enrollment) throw NotFound('Enrollment not found');
  if (enrollment.classroom.teacherId !== teacherId)
    throw Forbidden('Not your classroom');
  await prisma.enrollment.delete({ where: { id: enrollment.id } });
  res.json({ ok: true });
};

// ─── Student-side: join classroom ────────────────

const joinSchema = z.object({
  code: z.string().min(4).max(20).transform((s) => s.trim().toUpperCase()),
});

export const joinByCode = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { code } = joinSchema.parse(req.body);

  const classroom = await prisma.classroom.findUnique({
    where: { code },
    select: {
      id: true,
      name: true,
      subject: true,
      teacher: {
        select: { firstName: true, lastName: true },
      },
    },
  });
  if (!classroom) throw NotFound('No classroom found with that code');

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { userId_classroomId: { userId, classroomId: classroom.id } },
  });
  if (existing) throw BadRequest('You are already enrolled in this classroom');

  const enrollment = await prisma.enrollment.create({
    data: { userId, classroomId: classroom.id },
    include: {
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          teacher: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  res.status(201).json({ ok: true, enrollment });
};

export const myClassrooms = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    select: {
      id: true,
      joinedAt: true,
      classroom: {
        select: {
          id: true,
          name: true,
          description: true,
          subject: true,
          teacher: {
            select: { firstName: true, lastName: true },
          },
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
  res.json({ ok: true, enrollments });
};

export const leaveClassroom = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: req.params.enrollmentId, userId },
  });
  if (!enrollment) throw NotFound('Enrollment not found');
  await prisma.enrollment.delete({ where: { id: enrollment.id } });
  res.json({ ok: true });
};

// ─── Teacher Coding Problems ─────────────────────

const problemSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'slug must be lowercase-dashed only'),
  title: z.string().min(1).max(200),
  statement: z.string().min(10).max(50_000),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
  starterCode: z.record(z.string(), z.string()).refine((obj) => Object.keys(obj).length > 0, { message: 'At least one starter-code language required' }),
  testCases: z.array(z.object({ input: z.string(), expectedOutput: z.string(), isHidden: z.boolean().optional().default(false) })).min(1).max(50),
  timeLimitMs: z.number().int().min(100).max(60_000).default(2000),
  memoryLimitMb: z.number().int().min(16).max(1024).default(128),
});

export const listMyProblems = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const problems = await prisma.codingProblem.findMany({
    where: { createdById: userId },
    select: {
      id: true, slug: true, title: true, difficulty: true, status: true,
      tags: true, reviewNote: true, createdAt: true,
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ok: true, problems });
};

export const createMyProblem = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = problemSchema.parse(req.body);

  const existing = await prisma.codingProblem.findUnique({ where: { slug: data.slug } });
  if (existing) throw BadRequest(`Problem with slug "${data.slug}" already exists`);

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
      status: 'PENDING_REVIEW', // Teacher problems need admin approval
      createdById: userId,
    },
  });
  res.status(201).json({ ok: true, problem });
};

export const updateMyProblem = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = problemSchema.partial().omit({ slug: true }).parse(req.body);
  const existing = await prisma.codingProblem.findUnique({ where: { slug: req.params.slug } });
  if (!existing) throw NotFound('Problem not found');
  if (existing.createdById !== userId) throw Forbidden('Not your problem');
  // Can only edit DRAFT or REJECTED problems
  if (existing.status === 'APPROVED') throw BadRequest('Cannot edit an approved problem. Contact admin.');

  const problem = await prisma.codingProblem.update({
    where: { slug: req.params.slug },
    data: { ...data, status: 'PENDING_REVIEW', reviewNote: null }, // Re-submit for review
  });
  res.json({ ok: true, problem });
};

export const getMyProblem = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const problem = await prisma.codingProblem.findUnique({ where: { slug: req.params.slug } });
  if (!problem) throw NotFound('Problem not found');
  if (problem.createdById !== userId) throw Forbidden('Not your problem');
  res.json({ ok: true, problem });
};
