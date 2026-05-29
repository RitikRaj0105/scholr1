import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// ─── Unified feed ─────────────────────────────────────
//
// Returns a single mixed timeline: posts + jobs + services.
// Each item is tagged with `kind` so the frontend renders the right card.
//
// Query params:
//   filter = 'all' | 'posts' | 'jobs' | 'services'
//   search = optional text
//   limit  = how many of each type to fetch (default 15)
//
// Behaviour:
//   - Filtered to active items, respects blocks (between current user and authors)
//   - Mixes by date — newest first, regardless of type
//   - Personalized: when filter='all', the suggested jobs/services bubble up
//     in proportion to recency
export async function unifiedFeed(req: Request, res: Response) {
  const me = req.user!.id;
  const filter = (req.query.filter as string) || 'all';
  const search = (req.query.search as string) || '';
  const limit = Math.min(parseInt(req.query.limit as string) || 15, 50);

  // Build the block set so we hide items from people who blocked the viewer
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: me }, { blockedId: me }] },
    select: { blockerId: true, blockedId: true },
  });
  const blockedUserIds = new Set<string>();
  for (const b of blocks) {
    if (b.blockerId === me) blockedUserIds.add(b.blockedId);
    if (b.blockedId === me) blockedUserIds.add(b.blockerId);
  }

  // Who the user follows — for FOLLOWERS_ONLY posts
  const myFollowing = await prisma.follow.findMany({
    where: { followerId: me },
    select: { followingId: true },
  });
  const followingIds = new Set(myFollowing.map((f) => f.followingId));

  type FeedItem = {
    kind: 'POST' | 'JOB' | 'SERVICE';
    id: string;
    createdAt: Date;
    data: any;
  };

  const items: FeedItem[] = [];

  // ─── Posts ─────────────────────────────────────────
  if (filter === 'all' || filter === 'posts') {
    const where: any = {
      AND: [
        { userId: { notIn: Array.from(blockedUserIds) } },
        {
          OR: [
            { visibility: 'PUBLIC' },
            { userId: me },
            { AND: [{ visibility: 'FOLLOWERS_ONLY' }, { userId: { in: Array.from(followingIds) } }] },
          ],
        },
      ],
    };
    if (search) {
      where.AND.push({ content: { contains: search, mode: 'insensitive' } });
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, headline: true, role: true },
        },
        likes: { where: { userId: me }, select: { id: true } },
      },
    });

    for (const p of posts) {
      items.push({
        kind: 'POST',
        id: p.id,
        createdAt: p.createdAt,
        data: {
          ...p,
          likedByMe: p.likes.length > 0,
          likes: undefined,
        },
      });
    }
  }

  // ─── Jobs ──────────────────────────────────────────
  if (filter === 'all' || filter === 'jobs') {
    const where: any = {
      isActive: true,
      recruiterId: { notIn: Array.from(blockedUserIds) },
    };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { postedAt: 'desc' },
      take: limit,
      include: {
        recruiter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { applications: true } },
      },
    });

    for (const j of jobs) {
      items.push({
        kind: 'JOB',
        id: j.id,
        createdAt: j.postedAt,
        data: j,
      });
    }
  }

  // ─── Service providers ─────────────────────────────
  if (filter === 'all' || filter === 'services') {
    const where: any = {
      isActive: true,
      userId: { notIn: Array.from(blockedUserIds) },
    };
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { customCategory: { contains: search, mode: 'insensitive' } },
      ];
    }

    const services = await prisma.serviceProfile.findMany({
      where,
      orderBy: [{ avgRating: 'desc' }, { createdAt: 'desc' }],
      take: filter === 'services' ? limit : Math.ceil(limit / 2),
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, city: true, state: true },
        },
      },
    });

    for (const s of services) {
      items.push({
        kind: 'SERVICE',
        id: s.id,
        createdAt: s.createdAt,
        data: s,
      });
    }
  }

  // ─── Mix and sort by recency ───────────────────────
  // When filter='all', interleave types by date so the feed feels alive.
  // When filter is specific, items are already same-type and just need sort.
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Search users if search query exists
  let users: any[] = [];
  if (search) {
    users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(blockedUserIds) },
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { headline: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        headline: true,
        role: true,
        city: true,
      },
      take: 10,
    });
  }

  res.json({ items: items.slice(0, limit * 2), users });
}
