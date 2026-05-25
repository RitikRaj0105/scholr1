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

// ─── Suggested jobs based on user profile ─────────────
//
// Matching heuristic, layered from strongest to weakest signal:
//   1. Direct skill match → score by # skills matched
//   2. Category match (inferred from role + profileData)
//   3. Location match (city or state)
//   4. Recently posted (fallback so result list is never empty)
//
// Returns jobs sorted by relevance score (desc), tie-break by recency.
export async function suggestedJobs(req: Request, res: Response) {
  const me = req.user!;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  // Pull the user's matching signals
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true, role: true, skills: true, city: true, state: true, profileData: true,
    },
  });
  if (!user) return res.json({ jobs: [] });

  const profileData = (user.profileData as any) || {};
  const skills = (user.skills || []).map((s) => s.toLowerCase());

  // Infer preferred categories from role + profileData
  const preferredCategories = inferCategories(user.role, profileData, skills);

  // Pull a wide-ish candidate pool (active jobs only), then score in JS
  const candidates = await prisma.job.findMany({
    where: {
      isActive: true,
      recruiterId: { not: me.id },     // don't suggest jobs you posted yourself
    },
    orderBy: { postedAt: 'desc' },
    take: 200,
    include: {
      recruiter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { applications: true } },
    },
  });

  // Filter out jobs the user already applied to
  const myApplications = await prisma.application.findMany({
    where: { userId: me.id },
    select: { jobId: true },
  });
  const appliedIds = new Set(myApplications.map((a) => a.jobId));

  // Score each candidate
  const scored = candidates
    .filter((j) => !appliedIds.has(j.id))
    .map((j) => {
      let score = 0;
      const jobSkills = (j.skills || []).map((s) => s.toLowerCase());
      const text = `${j.title} ${j.description} ${j.company}`.toLowerCase();

      // Skill matches — both direct array intersection and keyword presence
      for (const s of skills) {
        if (jobSkills.includes(s)) score += 5;
        else if (text.includes(s)) score += 2;
      }

      // Category match
      if (preferredCategories.includes(j.category)) score += 4;

      // Location match
      if (user.city && j.location?.toLowerCase().includes(user.city.toLowerCase())) score += 3;
      else if (user.state && j.location?.toLowerCase().includes(user.state.toLowerCase())) score += 1;

      // Recency bonus — last 7 days
      const ageDays = (Date.now() - j.postedAt.getTime()) / (24 * 3600 * 1000);
      if (ageDays < 7) score += 1;

      return { job: j, score };
    });

  // Sort and slice
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.job.postedAt.getTime() - a.job.postedAt.getTime();
  });

  // If literally nothing matched (e.g. brand-new account with no skills), fall back to recent jobs
  const top = scored.slice(0, limit);
  if (top.every((s) => s.score === 0) && candidates.length > 0) {
    return res.json({
      jobs: candidates.slice(0, limit),
      suggestionBasis: 'recent',
    });
  }

  res.json({
    jobs: top.map((s) => s.job),
    suggestionBasis: 'profile',
    preferredCategories,
  });
}

// Map a user's role + profile data into job categories they'd plausibly want.
function inferCategories(role: string, profileData: any, skills: string[]): string[] {
  const cats = new Set<string>();
  const s = skills.join(' ').toLowerCase();
  const dataStr = JSON.stringify(profileData || {}).toLowerCase();
  const combined = `${s} ${dataStr}`;

  // Role-based hints
  if (role === 'COLLEGE_STUDENT' || role === 'STUDENT') {
    // Heavy weight on what they're studying
    if (/comput|software|cs |it |coding|programming/.test(combined)) {
      cats.add('TECH').add('PROFESSIONAL');
    }
    if (/medic|nurs|pharm|health/.test(combined)) cats.add('HEALTHCARE');
    if (/teach|educat|tutor/.test(combined)) cats.add('EDUCATION');
    if (/cook|chef|culinary|kitchen/.test(combined)) cats.add('COOK');
    if (/driver|driving/.test(combined)) cats.add('DRIVER');
    if (/electric|plumb|carpent|mechan/.test(combined)) cats.add('ELECTRICIAN');
    if (/construc|labour|labor|mason|painter/.test(combined)) cats.add('LABOUR');
    if (/secur|guard|watchman/.test(combined)) cats.add('SECURITY');
    if (/beaut|salon|stylist|makeup/.test(combined)) cats.add('BEAUTY');
    if (/garden|landscap|farm/.test(combined)) cats.add('GARDENER');
    if (/retail|shop|sales|cashier/.test(combined)) cats.add('RETAIL');
  }
  if (role === 'WORKING_PROFESSIONAL' || role === 'RECRUITER') {
    if (/develop|engineer|softw|code|python|java|react|node|aws|cloud|data|ml|ai/.test(combined)) {
      cats.add('TECH');
    }
    if (/manage|finance|account|business|consult|hr|marketing/.test(combined)) {
      cats.add('PROFESSIONAL');
    }
  }
  if (role === 'TEACHER') cats.add('EDUCATION');

  // Skill-based hints (always run, regardless of role)
  if (/python|javascript|java|c\+\+|react|sql|tensorflow|docker|aws|kubernetes/.test(s)) {
    cats.add('TECH');
  }
  if (/excel|sap|tally|powerbi|sales/.test(s)) cats.add('PROFESSIONAL');
  if (/cook|baker|chef/.test(s)) cats.add('COOK');
  if (/drive|driving/.test(s)) cats.add('DRIVER');
  if (/electric|plumb|carpent/.test(s)) cats.add('ELECTRICIAN');

  // Always include "PROFESSIONAL" + "TECH" as broad fallbacks for college students
  if (role === 'COLLEGE_STUDENT' && cats.size === 0) {
    cats.add('TECH').add('PROFESSIONAL').add('EDUCATION');
  }

  return Array.from(cats);
}

// ─── Quick post from feed / inline composer (lightweight) ────
const quickPostSchema = z.object({
  title: z.string().min(2).max(120),
  category: z.enum(JOB_CATEGORIES).default('OTHER'),
  type: z.enum(JOB_TYPES).default('GIG'),
  location: z.string().max(120).optional(),
  description: z.string().min(5).max(2000),
  dailyWage: z.number().int().nonnegative().optional(),
  contactPhone: z.string().max(20).optional(),
});

export async function quickPostJob(req: Request, res: Response) {
  const me = req.user!.id;
  const data = quickPostSchema.parse(req.body);

  // Use the user's display name as the "company" for quick posts
  const user = await prisma.user.findUnique({
    where: { id: me },
    select: { firstName: true, lastName: true },
  });
  const posterName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Listing';

  const job = await prisma.job.create({
    data: {
      ...data,
      company: posterName,
      payPeriod: data.dailyWage ? 'per day' : null,
      recruiterId: me,
    },
  });

  res.status(201).json({ job });
}
