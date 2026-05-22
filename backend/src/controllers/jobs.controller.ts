import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';

const JOB_CATEGORIES = [
  'TECH', 'PROFESSIONAL', 'EDUCATION', 'HEALTHCARE',
  'DRIVER', 'COOK', 'HOUSEHOLD', 'SECURITY', 'LABOUR',
  'ELECTRICIAN', 'GARDENER', 'BEAUTY', 'RETAIL', 'OTHER',
] as const;

const JOB_TYPES = [
  'FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE', 'GIG',
] as const;

const createSchema = z.object({
  title: z.string().min(2).max(120),
  company: z.string().min(1).max(120),
  location: z.string().max(120).optional(),
  remote: z.boolean().optional(),
  type: z.enum(JOB_TYPES).default('FULL_TIME'),
  category: z.enum(JOB_CATEGORIES).default('OTHER'),
  description: z.string().min(10).max(5000),
  requirements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  dailyWage: z.number().int().nonnegative().optional(),
  payPeriod: z.string().max(30).optional(),
  contactPhone: z.string().max(20).optional(),
  currency: z.string().default('INR'),
  expiresAt: z.string().datetime().optional(),
});

// ─── List jobs with filters ─────────────────────────
export async function listJobs(req: Request, res: Response) {
  const category = req.query.category as string | undefined;
  const type = req.query.type as string | undefined;
  const location = req.query.location as string | undefined;
  const search = req.query.search as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  const cursor = req.query.cursor as string | undefined;

  const where: any = { isActive: true };
  if (category && JOB_CATEGORIES.includes(category as any)) where.category = category;
  if (type && JOB_TYPES.includes(type as any)) where.type = type;
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { postedAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      recruiter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { applications: true } },
    },
  });

  const nextCursor = jobs.length > limit ? jobs[limit].id : null;
  if (nextCursor) jobs.pop();

  res.json({ jobs, nextCursor });
}

// ─── Single job detail ─────────────────────────────
export async function getJob(req: Request, res: Response) {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      recruiter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, headline: true } },
      _count: { select: { applications: true } },
    },
  });
  if (!job) throw NotFound('Job not found');

  // Has the current user applied?
  let appliedAt: Date | null = null;
  if (req.user) {
    const app = await prisma.application.findUnique({
      where: { jobId_userId: { jobId: job.id, userId: req.user.id } },
      select: { appliedAt: true },
    });
    appliedAt = app?.appliedAt || null;
  }

  res.json({ job, appliedAt });
}

// ─── Create a job (any signed-in user can post) ─────
export async function createJob(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const me = req.user!.id;

  const job = await prisma.job.create({
    data: {
      ...data,
      recruiterId: me,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  res.status(201).json({ job });
}

// ─── Update own job ────────────────────────────────
export async function updateJob(req: Request, res: Response) {
  const me = req.user!.id;
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) throw NotFound('Job not found');
  if (job.recruiterId !== me) throw Forbidden('Not your job listing');

  const data = createSchema.partial().parse(req.body);
  const updated = await prisma.job.update({
    where: { id: req.params.id },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });

  res.json({ job: updated });
}

// ─── Delete own job ────────────────────────────────
export async function deleteJob(req: Request, res: Response) {
  const me = req.user!.id;
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) throw NotFound('Job not found');
  if (job.recruiterId !== me) throw Forbidden('Not your job listing');

  await prisma.job.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}

// ─── My posted jobs ────────────────────────────────
export async function myPostedJobs(req: Request, res: Response) {
  const me = req.user!.id;
  const jobs = await prisma.job.findMany({
    where: { recruiterId: me },
    orderBy: { postedAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });
  res.json({ jobs });
}

// ─── Apply to a job ────────────────────────────────
const applySchema = z.object({
  coverLetter: z.string().max(2000).optional(),
  resumeUrl: z.string().url().optional(),
});

export async function applyToJob(req: Request, res: Response) {
  const me = req.user!.id;
  const jobId = req.params.id;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw NotFound('Job not found');
  if (!job.isActive) throw BadRequest('This job is no longer accepting applications');
  if (job.recruiterId === me) throw BadRequest("Can't apply to your own job");

  const { coverLetter, resumeUrl } = applySchema.parse(req.body);

  const existing = await prisma.application.findUnique({
    where: { jobId_userId: { jobId, userId: me } },
  });
  if (existing) throw BadRequest('Already applied');

  const application = await prisma.application.create({
    data: { jobId, userId: me, coverLetter, resumeUrl },
  });

  // Notify the poster
  await prisma.notification.create({
    data: {
      userId: job.recruiterId,
      fromUserId: me,
      type: 'JOB',
      title: 'New application',
      body: `Someone applied for "${job.title}"`,
      link: `/dashboard/jobs/${jobId}/applications`,
    },
  }).catch(() => null);

  res.status(201).json({ application });
}

// ─── My applications ──────────────────────────────
export async function myApplications(req: Request, res: Response) {
  const me = req.user!.id;
  const applications = await prisma.application.findMany({
    where: { userId: me },
    orderBy: { appliedAt: 'desc' },
    include: {
      job: {
        include: {
          recruiter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  });
  res.json({ applications });
}

// ─── Applications for one of my jobs ──────────────
export async function jobApplications(req: Request, res: Response) {
  const me = req.user!.id;
  const jobId = req.params.id;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw NotFound('Job not found');
  if (job.recruiterId !== me) throw Forbidden('Not your job listing');

  const applications = await prisma.application.findMany({
    where: { jobId },
    orderBy: { appliedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true, avatarUrl: true,
          headline: true, phone: true, email: true, city: true, state: true,
          skills: true, resumeUrl: true,
        },
      },
    },
  });

  res.json({ job: { id: job.id, title: job.title }, applications });
}
