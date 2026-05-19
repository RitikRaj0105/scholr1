import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const list = (q = {}) =>
  prisma.marketplaceListing.findMany({
    where: {
      approved: true,
      ...(q.category ? { category: q.category } : {}),
      ...(q.q ? { OR: [
        { title: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
      ] } : {}),
    },
    include: { seller: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

export const get = async (id) => {
  const item = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, username: true, avatar: true, bio: true } },
      reviews: { include: { user: { select: { id: true, username: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!item) throw ApiError.notFound();
  return item;
};

export const create = (sellerId, data) => prisma.marketplaceListing.create({ data: { ...data, sellerId } });

export const update = async (sellerId, id, data) => {
  const item = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!item || item.sellerId !== sellerId) throw ApiError.notFound();
  return prisma.marketplaceListing.update({ where: { id }, data });
};

export const remove = async (sellerId, id) => {
  const item = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!item || item.sellerId !== sellerId) throw ApiError.notFound();
  await prisma.marketplaceListing.delete({ where: { id } });
  return { ok: true };
};

export const review = async (userId, listingId, data) => {
  const review = await prisma.marketplaceReview.upsert({
    where: { listingId_userId: { listingId, userId } },
    create: { ...data, userId, listingId },
    update: data,
  });
  const reviews = await prisma.marketplaceReview.findMany({ where: { listingId } });
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: { rating: avg, reviewCount: reviews.length },
  });
  return review;
};
