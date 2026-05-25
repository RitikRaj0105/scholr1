import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';

const SERVICE_CATEGORIES = [
  'TECH', 'PROFESSIONAL', 'EDUCATION', 'HEALTHCARE',
  'DRIVER', 'COOK', 'HOUSEHOLD', 'SECURITY', 'LABOUR',
  'ELECTRICIAN', 'GARDENER', 'BEAUTY', 'RETAIL', 'OTHER',
] as const;

// ─── Browse / search service providers ─────────────────────
//
// Public endpoint — anyone (signed in) can find a driver, cook, etc.
// Filters: category, custom-category text, location, language, minRating
export async function searchServices(req: Request, res: Response) {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const location = req.query.location as string | undefined;
  const language = req.query.language as string | undefined;
  const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);

  const where: any = { isActive: true };
  if (category && SERVICE_CATEGORIES.includes(category as any)) where.category = category;
  if (location) where.serviceArea = { contains: location, mode: 'insensitive' };
  if (language) where.languages = { has: language };
  if (minRating) where.avgRating = { gte: minRating };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { customCategory: { contains: search, mode: 'insensitive' } },
      { skills: { has: search } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const profiles = await prisma.serviceProfile.findMany({
    where,
    orderBy: [
      { isVerified: 'desc' },
      { avgRating: 'desc' },
      { bookingCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true, avatarUrl: true,
          city: true, state: true,
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  res.json({ profiles });
}

// ─── Get one service profile (detail page) ──────────────────
export async function getServiceProfile(req: Request, res: Response) {
  const profile = await prisma.serviceProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true, avatarUrl: true,
          headline: true, phone: true, email: true, city: true, state: true,
          showPhone: true, showEmail: true, showLocation: true,
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!profile) throw NotFound('Service profile not found');

  // Apply privacy: hide fields the provider chose to keep private
  // But: for service profiles, phone IS the primary contact, so we always show
  // it (the very point of listing is to be reachable).
  // Email respects showEmail; location respects showLocation.
  const u = profile.user;
  const sanitizedUser = {
    ...u,
    email: u.showEmail ? u.email : null,
    city: u.showLocation ? u.city : null,
    state: u.showLocation ? u.state : null,
  };

  res.json({ profile: { ...profile, user: sanitizedUser } });
}

// ─── My own service profile (for editing) ───────────────────
export async function getMyServiceProfile(req: Request, res: Response) {
  const me = req.user!.id;
  const profile = await prisma.serviceProfile.findUnique({
    where: { userId: me },
    include: { _count: { select: { reviews: true } } },
  });
  res.json({ profile });
}

// ─── Create or update own service profile ───────────────────
const upsertSchema = z.object({
  category: z.enum(SERVICE_CATEGORIES).default('OTHER'),
  customCategory: z.string().max(60).optional().nullable(),
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(3000),
  rate: z.number().int().nonnegative().optional().nullable(),
  ratePeriod: z.string().max(30).optional().nullable(),
  serviceArea: z.string().max(120).optional().nullable(),
  availability: z.string().max(120).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  languages: z.array(z.string().min(1).max(30)).max(10).optional(),
  skills: z.array(z.string().min(1).max(60)).max(30).optional(),
  isActive: z.boolean().optional(),
});

export async function upsertServiceProfile(req: Request, res: Response) {
  const me = req.user!.id;
  const data = upsertSchema.parse(req.body);

  // If the category is OTHER, require a customCategory
  if (data.category === 'OTHER' && !data.customCategory?.trim()) {
    throw BadRequest('Please type your profession (e.g. "Gym Trainer", "Caretaker")');
  }

  // Pull main-profile fallbacks so the service profile doesn't duplicate
  // user data. If serviceArea/skills aren't provided, derive them from the
  // main profile so the user doesn't have to enter the same info twice.
  const mainProfile = await prisma.user.findUnique({
    where: { id: me },
    select: {
      city: true, state: true, skills: true, headline: true,
    },
  });

  const serviceArea = data.serviceArea ?? null
    ?? (mainProfile?.city ? [mainProfile.city, mainProfile.state].filter(Boolean).join(', ') : null);

  // Merge skills: main profile skills + any service-specific skills the user added
  const mergedSkills = Array.from(new Set([
    ...(mainProfile?.skills || []),
    ...(data.skills || []),
  ]));

  const profile = await prisma.serviceProfile.upsert({
    where: { userId: me },
    create: {
      userId: me,
      category: data.category,
      customCategory: data.customCategory?.trim() || null,
      title: data.title.trim(),
      description: data.description.trim(),
      rate: data.rate ?? null,
      ratePeriod: data.ratePeriod ?? null,
      serviceArea: data.serviceArea?.trim() || serviceArea,
      availability: data.availability ?? null,
      yearsExperience: data.yearsExperience ?? 0,
      languages: data.languages ?? [],
      skills: mergedSkills,
      isActive: data.isActive ?? true,
    },
    update: {
      category: data.category,
      customCategory: data.customCategory?.trim() || null,
      title: data.title.trim(),
      description: data.description.trim(),
      rate: data.rate,
      ratePeriod: data.ratePeriod,
      serviceArea: data.serviceArea?.trim() || serviceArea,
      availability: data.availability,
      yearsExperience: data.yearsExperience,
      languages: data.languages,
      skills: data.skills && data.skills.length > 0 ? mergedSkills : mergedSkills,
      isActive: data.isActive,
    },
  });

  res.json({ profile });
}

// ─── Delete own service profile ────────────────────────────
export async function deleteServiceProfile(req: Request, res: Response) {
  const me = req.user!.id;
  await prisma.serviceProfile.delete({ where: { userId: me } }).catch(() => null);
  res.json({ ok: true });
}

// ─── Leave a review ────────────────────────────────────────
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  hired: z.boolean().optional(),
});

export async function submitReview(req: Request, res: Response) {
  const me = req.user!.id;
  const profileId = req.params.id;
  const data = reviewSchema.parse(req.body);

  const profile = await prisma.serviceProfile.findUnique({
    where: { id: profileId },
    select: { id: true, userId: true },
  });
  if (!profile) throw NotFound('Service profile not found');
  if (profile.userId === me) throw BadRequest("Can't review your own profile");

  // Upsert (one review per reviewer per profile, but allows edit)
  const review = await prisma.serviceReview.upsert({
    where: { profileId_reviewerId: { profileId, reviewerId: me } },
    create: {
      profileId,
      reviewerId: me,
      rating: data.rating,
      comment: data.comment,
      hired: data.hired ?? false,
    },
    update: {
      rating: data.rating,
      comment: data.comment,
      hired: data.hired,
    },
  });

  // Recompute aggregate
  const stats = await prisma.serviceReview.aggregate({
    where: { profileId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.serviceProfile.update({
    where: { id: profileId },
    data: {
      avgRating: stats._avg.rating || 0,
      ratingCount: stats._count.rating,
    },
  });

  // Notify provider
  await prisma.notification.create({
    data: {
      userId: profile.userId,
      fromUserId: me,
      type: 'SYSTEM',
      title: 'New review',
      body: `Someone left you a ${data.rating}-star review`,
      link: `/dashboard/services/me`,
    },
  }).catch(() => null);

  res.status(201).json({ review });
}

// ─── Delete own review ─────────────────────────────────────
export async function deleteReview(req: Request, res: Response) {
  const me = req.user!.id;
  const reviewId = req.params.reviewId;
  const review = await prisma.serviceReview.findUnique({ where: { id: reviewId } });
  if (!review) throw NotFound('Review not found');
  if (review.reviewerId !== me) throw Forbidden('Can only delete your own reviews');

  const profileId = review.profileId;
  await prisma.serviceReview.delete({ where: { id: reviewId } });

  // Recompute aggregate
  const stats = await prisma.serviceReview.aggregate({
    where: { profileId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.serviceProfile.update({
    where: { id: profileId },
    data: {
      avgRating: stats._avg.rating || 0,
      ratingCount: stats._count.rating,
    },
  });

  res.json({ ok: true });
}

// ─── Mark provider as contacted (bumps bookingCount, used as social proof) ──
export async function recordContact(req: Request, res: Response) {
  const me = req.user!.id;
  const profileId = req.params.id;
  const profile = await prisma.serviceProfile.findUnique({ where: { id: profileId } });
  if (!profile) throw NotFound('Service profile not found');
  if (profile.userId === me) return res.json({ ok: true }); // no-op on self

  await prisma.serviceProfile.update({
    where: { id: profileId },
    data: { bookingCount: { increment: 1 } },
  });
  res.json({ ok: true });
}
