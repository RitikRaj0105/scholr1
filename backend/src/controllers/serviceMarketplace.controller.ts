import type { Request, Response } from 'express';
import { PrismaClient, ServiceCategory, BookingStatus, AvailabilityStatus, ServiceReportReason } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Haversine distance in kilometers.
 * Used for filtering providers within a user's search radius.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Create a notification (assumes you have a Notification model).
 */
async function notify(userId: string, title: string, body: string, link?: string, fromUserId?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        fromUserId,
        type: 'SYSTEM',
        title,
        body,
        link,
      },
    });
  } catch (e) {
    console.warn('notification failed:', e);
  }
}

// ─────────────────────────────────────────────────────────────
// PROVIDER PROFILE
// ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  displayName: z.string().min(2).max(100),
  category: z.nativeEnum(ServiceCategory),
  customCategory: z.string().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  experienceYears: z.number().int().min(0).max(80).default(0),
  skills: z.array(z.string()).default([]),
  hourlyRate: z.number().nonnegative().optional().nullable(),
  fixedPrice: z.number().nonnegative().optional().nullable(),
  priceUnit: z.string().default('hour'),
  currency: z.string().default('INR'),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressLine: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  serviceRadiusKm: z.number().int().min(1).max(500).default(10),
  availability: z.nativeEnum(AvailabilityStatus).default('AVAILABLE'),
  portfolioImages: z.array(z.string()).default([]),
});

export async function createOrUpdateProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  const data = profileSchema.parse(req.body);

  if (data.category === 'OTHER' && !data.customCategory?.trim()) {
    return res.status(400).json({ error: 'customCategory is required when category is OTHER' });
  }

  const existing = await prisma.serviceProfile.findUnique({ where: { userId } });

  const profile = existing
    ? await prisma.serviceProfile.update({
        where: { userId },
        data,
      })
    : await prisma.serviceProfile.create({
        data: { userId, ...data },
      });

  res.json(profile);
}

export async function getMyProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  const profile = await prisma.serviceProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
    },
  });
  res.json(profile);
}

export async function deactivateMyProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  await prisma.serviceProfile.update({
    where: { userId },
    data: { isActive: false },
  });
  res.json({ ok: true });
}

export async function updateAvailability(req: Request, res: Response) {
  const userId = req.user!.id;
  const { availability } = req.body;
  if (!Object.values(AvailabilityStatus).includes(availability)) {
    return res.status(400).json({ error: 'Invalid availability' });
  }
  const profile = await prisma.serviceProfile.update({
    where: { userId },
    data: { availability },
  });
  res.json(profile);
}

// ─────────────────────────────────────────────────────────────
// PROVIDER DISCOVERY (geolocation-filtered)
// ─────────────────────────────────────────────────────────────

export async function listProviders(req: Request, res: Response) {
  const userId = req.user?.id;
  const {
    lat,
    lng,
    radius = '25',
    category,
    minRating,
    search,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const userRadius = parseFloat(radius);

  if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  // Pre-filter at DB level (bounding box, then exact filter in memory)
  const latDelta = userRadius / 111;
  const lngDelta = userRadius / (111 * Math.cos((userLat * Math.PI) / 180));

  const where: any = {
    isActive: true,
    availability: { not: AvailabilityStatus.OFFLINE },
    latitude: { gte: userLat - latDelta, lte: userLat + latDelta },
    longitude: { gte: userLng - lngDelta, lte: userLng + lngDelta },
  };
  if (category && category !== 'ALL') where.category = category;
  if (minRating) where.avgRating = { gte: parseFloat(minRating) };
  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { customCategory: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
      { skills: { hasSome: [search.toLowerCase(), search] } },
    ];
  }

  const all = await prisma.serviceProfile.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  // Get logged-in user's favorites
  const favs = userId
    ? new Set(
        (await prisma.serviceFavorite.findMany({ where: { userId }, select: { providerId: true } }))
          .map((f) => f.providerId)
      )
    : new Set<string>();

  // Filter by exact distance AND respect provider's own radius
  const enriched = all
    .map((p) => {
      const distanceKm = haversineKm(userLat, userLng, p.latitude, p.longitude);
      return { ...p, distanceKm, isFavorited: favs.has(p.id) };
    })
    .filter((p) => p.distanceKm <= Math.min(userRadius, p.serviceRadiusKm))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const pageNum = Math.max(1, parseInt(page));
  const lim = Math.max(1, Math.min(50, parseInt(limit)));
  const start = (pageNum - 1) * lim;
  const slice = enriched.slice(start, start + lim);

  res.json({
    items: slice,
    total: enriched.length,
    page: pageNum,
    limit: lim,
  });
}

export async function getProviderPublic(req: Request, res: Response) {
  const { providerId } = req.params;
  const userId = req.user?.id;

  const provider = await prisma.serviceProfile.findFirst({
    where: { id: providerId, isActive: true },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      reviews: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  const isFavorited = userId
    ? !!(await prisma.serviceFavorite.findUnique({
        where: { userId_providerId: { userId, providerId } },
      }))
    : false;

  res.json({ ...provider, isFavorited });
}

// ─────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────

const bookingSchema = z.object({
  providerId: z.string(),
  serviceAddress: z.string().min(5),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  pincode: z.string().optional(),
  bookingDate: z.string(),       // ISO date
  startTime: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  expectedPrice: z.number().nonnegative().optional(),
});

export async function createBooking(req: Request, res: Response) {
  const customerId = req.user!.id;
  const data = bookingSchema.parse(req.body);

  const provider = await prisma.serviceProfile.findUnique({
    where: { id: data.providerId },
    include: { user: { select: { id: true } } },
  });
  if (!provider || !provider.isActive) {
    return res.status(404).json({ error: 'Provider not available' });
  }
  if (provider.userId === customerId) {
    return res.status(400).json({ error: 'You cannot book your own service' });
  }

  const booking = await prisma.serviceBooking.create({
    data: {
      customerId,
      providerId: data.providerId,
      serviceAddress: data.serviceAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      pincode: data.pincode,
      bookingDate: new Date(data.bookingDate),
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      notes: data.notes,
      expectedPrice: data.expectedPrice,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      provider: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  // Create chat thread automatically
  await prisma.serviceChat.create({
    data: {
      bookingId: booking.id,
      customerId,
      providerId: data.providerId,
    },
  });

  // Notify provider
  await notify(
    provider.userId,
    'New booking request',
    `${booking.customer.firstName || 'A user'} requested a service for ${new Date(data.bookingDate).toLocaleDateString()}`,
    `/services/provider/bookings/${booking.id}`,
    customerId
  );

  // Emit real-time event if socket.io available
  try {
    const io = (req.app as any).get('io');
    if (io) {
      io.to(`user:${provider.userId}`).emit('booking:new', booking);
    }
  } catch {}

  res.json(booking);
}

export async function respondToBooking(req: Request, res: Response) {
  const userId = req.user!.id;
  const { bookingId } = req.params;
  const { action, providerNote } = req.body; // 'ACCEPT' | 'REJECT'

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { provider: true, customer: { select: { firstName: true } } },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.provider.userId !== userId) {
    return res.status(403).json({ error: 'Not your booking to respond to' });
  }
  if (booking.status !== 'PENDING') {
    return res.status(400).json({ error: `Booking is already ${booking.status}` });
  }

  const newStatus: BookingStatus =
    action === 'ACCEPT' ? 'ACCEPTED' : action === 'REJECT' ? 'REJECTED' : 'PENDING';
  if (newStatus === 'PENDING') return res.status(400).json({ error: 'Invalid action' });

  const updated = await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: {
      status: newStatus,
      respondedAt: new Date(),
      providerNote,
    },
  });

  // Notify customer
  await notify(
    booking.customerId,
    newStatus === 'ACCEPTED' ? 'Booking accepted' : 'Booking declined',
    newStatus === 'ACCEPTED'
      ? 'Your service provider accepted the booking'
      : `Your booking was declined${providerNote ? `: ${providerNote}` : ''}`,
    `/services/my-bookings/${bookingId}`,
    userId
  );

  try {
    const io = (req.app as any).get('io');
    if (io) io.to(`user:${booking.customerId}`).emit('booking:update', updated);
  } catch {}

  res.json(updated);
}

export async function completeBooking(req: Request, res: Response) {
  const userId = req.user!.id;
  const { bookingId } = req.params;
  const { finalPrice } = req.body;

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { provider: true },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.provider.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (!['ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
    return res.status(400).json({ error: `Cannot complete from status ${booking.status}` });
  }

  const updated = await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      finalPrice,
    },
  });

  await prisma.serviceProfile.update({
    where: { id: booking.providerId },
    data: { totalBookings: { increment: 1 } },
  });

  await notify(
    booking.customerId,
    'Service completed',
    'Please rate your service experience',
    `/services/my-bookings/${bookingId}`,
    userId
  );

  res.json(updated);
}

export async function cancelBooking(req: Request, res: Response) {
  const userId = req.user!.id;
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { provider: true },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const isCustomer = booking.customerId === userId;
  const isProvider = booking.provider.userId === userId;
  if (!isCustomer && !isProvider) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
    return res.status(400).json({ error: `Cannot cancel from status ${booking.status}` });
  }

  const updated = await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledById: userId,
      cancelReason: reason,
    },
  });

  const notifyTarget = isCustomer ? booking.provider.userId : booking.customerId;
  await notify(notifyTarget, 'Booking cancelled', reason || 'The booking was cancelled', `/services/my-bookings/${bookingId}`, userId);

  res.json(updated);
}

export async function listMyBookings(req: Request, res: Response) {
  const userId = req.user!.id;
  const { role = 'customer', status } = req.query as Record<string, string>;

  const where: any = {};
  if (role === 'provider') {
    const myProfile = await prisma.serviceProfile.findUnique({ where: { userId } });
    if (!myProfile) return res.json({ items: [] });
    where.providerId = myProfile.id;
  } else {
    where.customerId = userId;
  }
  if (status) where.status = status;

  const bookings = await prisma.serviceBooking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
      provider: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
        },
      },
      review: true,
    },
  });

  res.json({ items: bookings });
}

export async function getBooking(req: Request, res: Response) {
  const userId = req.user!.id;
  const { bookingId } = req.params;

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
      provider: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
        },
      },
      review: true,
    },
  });
  if (!booking) return res.status(404).json({ error: 'Not found' });
  if (booking.customerId !== userId && booking.provider.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  res.json(booking);
}

// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────

export async function createReview(req: Request, res: Response) {
  const userId = req.user!.id;
  const { bookingId, rating, comment } = req.body;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be 1-5' });
  }

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.customerId !== userId) {
    return res.status(403).json({ error: 'Only the customer can review' });
  }
  if (booking.status !== 'COMPLETED') {
    return res.status(400).json({ error: 'Only completed bookings can be reviewed' });
  }
  if (booking.review) {
    return res.status(400).json({ error: 'Review already exists' });
  }

  const review = await prisma.serviceReview.create({
    data: {
      bookingId,
      customerId: userId,
      providerId: booking.providerId,
      rating,
      comment,
    },
  });

  // Recompute provider's avg rating
  const stats = await prisma.serviceReview.aggregate({
    where: { providerId: booking.providerId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.serviceProfile.update({
    where: { id: booking.providerId },
    data: {
      avgRating: stats._avg.rating ?? 0,
      totalReviews: stats._count,
    },
  });

  const provider = await prisma.serviceProfile.findUnique({ where: { id: booking.providerId } });
  if (provider) {
    await notify(provider.userId, 'New review', `You received a ${rating}-star review`, `/services/provider/profile`, userId);
  }

  res.json(review);
}

export async function replyToReview(req: Request, res: Response) {
  const userId = req.user!.id;
  const { reviewId } = req.params;
  const { reply } = req.body;

  const review = await prisma.serviceReview.findUnique({
    where: { id: reviewId },
    include: { provider: true },
  });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.provider.userId !== userId) {
    return res.status(403).json({ error: 'Not your review to reply to' });
  }

  const updated = await prisma.serviceReview.update({
    where: { id: reviewId },
    data: { providerReply: reply, repliedAt: new Date() },
  });

  res.json(updated);
}

// ─────────────────────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────────────────────

export async function toggleFavorite(req: Request, res: Response) {
  const userId = req.user!.id;
  const { providerId } = req.params;

  const existing = await prisma.serviceFavorite.findUnique({
    where: { userId_providerId: { userId, providerId } },
  });

  if (existing) {
    await prisma.serviceFavorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }

  await prisma.serviceFavorite.create({ data: { userId, providerId } });
  res.json({ favorited: true });
}

export async function listFavorites(req: Request, res: Response) {
  const userId = req.user!.id;
  const favorites = await prisma.serviceFavorite.findMany({
    where: { userId },
    include: {
      provider: {
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ items: favorites.map((f) => ({ ...f.provider, isFavorited: true })) });
}

// ─────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────

export async function getChatForBooking(req: Request, res: Response) {
  const userId = req.user!.id;
  const { bookingId } = req.params;

  const chat = await prisma.serviceChat.findUnique({
    where: { bookingId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      booking: { include: { provider: { select: { userId: true } } } },
    },
  });
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (chat.customerId !== userId && chat.booking.provider.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // Mark messages from the other party as read
  await prisma.serviceChatMessage.updateMany({
    where: { chatId: chat.id, senderId: { not: userId }, read: false },
    data: { read: true },
  });

  res.json(chat);
}

export async function sendChatMessage(req: Request, res: Response) {
  const userId = req.user!.id;
  const { bookingId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) return res.status(400).json({ error: 'content required' });

  const chat = await prisma.serviceChat.findUnique({
    where: { bookingId },
    include: { booking: { include: { provider: { select: { userId: true } } } } },
  });
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (chat.customerId !== userId && chat.booking.provider.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const msg = await prisma.serviceChatMessage.create({
    data: { chatId: chat.id, senderId: userId, content: content.trim() },
  });
  await prisma.serviceChat.update({
    where: { id: chat.id },
    data: { lastMessageAt: new Date() },
  });

  const recipientId =
    userId === chat.customerId ? chat.booking.provider.userId : chat.customerId;

  try {
    const io = (req.app as any).get('io');
    if (io) io.to(`user:${recipientId}`).emit('chat:message', { ...msg, bookingId });
  } catch {}

  await notify(recipientId, 'New message', content.slice(0, 100), `/services/chat/${bookingId}`, userId);

  res.json(msg);
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

export async function reportProvider(req: Request, res: Response) {
  const reporterId = req.user!.id;
  const { providerId } = req.params;
  const { reason, details } = req.body;

  if (!Object.values(ServiceReportReason).includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason' });
  }

  try {
    const report = await prisma.serviceProviderReport.create({
      data: {
        providerId,
        reporterId,
        reason,
        details,
      },
    });
    res.json(report);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'You have already reported this provider' });
    }
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────

export async function adminListReports(req: Request, res: Response) {
  const { status = 'PENDING' } = req.query as Record<string, string>;
  const reports = await prisma.serviceProviderReport.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
      provider: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });
  res.json({ items: reports });
}

export async function adminReviewReport(req: Request, res: Response) {
  const userId = req.user!.id;
  const { reportId } = req.params;
  const { action, note } = req.body; // 'DEACTIVATE' | 'DISMISS' | 'VERIFY'

  const report = await prisma.serviceProviderReport.findUnique({ where: { id: reportId } });
  if (!report) return res.status(404).json({ error: 'Report not found' });

  let providerUpdate: any = null;
  if (action === 'DEACTIVATE') {
    providerUpdate = await prisma.serviceProfile.update({
      where: { id: report.providerId },
      data: { isActive: false },
    });
  }

  await prisma.serviceProviderReport.update({
    where: { id: reportId },
    data: {
      status: action === 'DISMISS' ? 'DISMISSED' : 'REVIEWED',
      reviewerId: userId,
      reviewNote: note,
    },
  });

  res.json({ ok: true, providerUpdate });
}

export async function adminVerifyProvider(req: Request, res: Response) {
  const { providerId } = req.params;
  const { verified } = req.body;
  const updated = await prisma.serviceProfile.update({
    where: { id: providerId },
    data: { isVerified: !!verified },
  });
  res.json(updated);
}
