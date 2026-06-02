import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';

// ─── Helpers ─────────────────────────────────────

/** Get user IDs the current user has blocked (or who blocked them) */
async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    if (b.blockerId === userId) ids.add(b.blockedId);
    else ids.add(b.blockerId);
  }
  return Array.from(ids);
}

/** Determine if user A can see user B's post given visibility rules */
async function canSeePost(
  viewerId: string,
  authorId: string,
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'
): Promise<boolean> {
  if (viewerId === authorId) return true;
  if (visibility === 'PRIVATE') return false;
  if (visibility === 'PUBLIC') return true;
  // FOLLOWERS_ONLY: check follow relationship
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: authorId } },
  });
  return !!follow;
}

const safeUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  role: true,
  headline: true,
};

// ─── Posts ───────────────────────────────────────

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['POST', 'ACHIEVEMENT', 'CERTIFICATE', 'MILESTONE']).default('POST'),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE']).default('PUBLIC'),
  imageUrl: z.string().optional(),
  achievement: z
    .object({
      title: z.string(),
      subject: z.string().optional(),
      score: z.string().optional(),
      date: z.string().optional(),
    })
    .optional(),
  certificate: z
    .object({
      title: z.string(),
      issuer: z.string(),
      credentialUrl: z.string().optional(),
    })
    .optional(),
});

export const createPost = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = createPostSchema.parse(req.body);

  const post = await prisma.post.create({
    data: {
      userId,
      content: data.content,
      type: data.type,
      visibility: data.visibility,
      imageUrl: data.imageUrl ?? null,
      achievement: data.achievement ?? undefined,
      certificate: data.certificate ?? undefined,
    },
    include: { user: { select: safeUserSelect } },
  });

  res.status(201).json({ ok: true, post });
};

export const deletePost = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw NotFound('Post not found');
  if (post.userId !== userId) throw Forbidden('Not your post');
  await prisma.post.delete({ where: { id: post.id } });
  res.json({ ok: true });
};

export const getPost = async (req: Request, res: Response) => {
  const viewerId = req.user!.id;
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: safeUserSelect },
      _count: { select: { likes: true, comments: true, shares: true } },
    },
  });
  if (!post) throw NotFound('Post not found');

  // Block check
  const blocked = await getBlockedUserIds(viewerId);
  if (blocked.includes(post.userId)) throw NotFound('Post not available');

  // Visibility check
  if (!(await canSeePost(viewerId, post.userId, post.visibility))) {
    throw Forbidden('Cannot view this post');
  }

  // Has the viewer liked it?
  const liked = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: viewerId, postId: post.id } },
  });

  res.json({ ok: true, post: { ...post, isLikedByMe: !!liked } });
};

// ─── Feed ────────────────────────────────────────

export const getFeed = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const cursor = (req.query.cursor as string) || undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '20'), 50);

  // Get who the user follows + themselves
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const authorIds = [userId, ...following.map((f) => f.followingId)];

  // Filter out blocked
  const blocked = await getBlockedUserIds(userId);
  const visibleAuthorIds = authorIds.filter((id) => !blocked.includes(id));

  const posts = await prisma.post.findMany({
    where: {
      userId: { in: visibleAuthorIds },
      visibility: { not: 'PRIVATE' }, // We'll filter PRIVATE in JS for own posts only
      OR: [
        { userId },                                        // own posts (any visibility)
        { visibility: 'PUBLIC' },
        { visibility: 'FOLLOWERS_ONLY', user: { followers: { some: { followerId: userId } } } },
      ],
    },
    include: {
      user: { select: safeUserSelect },
      likes: { where: { userId }, select: { id: true } },
      _count: { select: { likes: true, comments: true, shares: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const items = posts.slice(0, limit).map((p) => ({
    ...p,
    isLikedByMe: p.likes.length > 0,
    likes: undefined,
  }));

  res.json({
    ok: true,
    posts: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
};

// ─── Likes ───────────────────────────────────────

export const toggleLike = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const postId = req.params.id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw NotFound('Post not found');

  // Block check
  const blocked = await getBlockedUserIds(userId);
  if (blocked.includes(post.userId)) throw NotFound('Post not available');

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.postLike.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    res.json({ ok: true, liked: false });
  } else {
    await prisma.$transaction([
      prisma.postLike.create({ data: { userId, postId } }),
      prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
    ]);
    // Notify post author
    const liker = await getDisplayName(userId);
    await notify({
      userId: post.userId,
      fromUserId: userId,
      type: 'POST_LIKE',
      title: `${liker} liked your post`,
      link: `/dashboard/feed`,
    });
    res.json({ ok: true, liked: true });
  }
};

// ─── Comments ────────────────────────────────────

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const addComment = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const postId = req.params.id;
  const { content } = commentSchema.parse(req.body);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw NotFound('Post not found');

  // Block check
  const blocked = await getBlockedUserIds(userId);
  if (blocked.includes(post.userId)) throw NotFound('Post not available');

  const [comment] = await prisma.$transaction([
    prisma.postComment.create({
      data: { userId, postId, content },
      include: { user: { select: safeUserSelect } },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  // Notify post author
  const commenterName = await getDisplayName(userId);
  await notify({
    userId: post.userId,
    fromUserId: userId,
    type: 'POST_COMMENT',
    title: `${commenterName} commented on your post`,
    body: content.slice(0, 80),
    link: '/dashboard/feed',
  });

  res.status(201).json({ ok: true, comment });
};

export const listComments = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const comments = await prisma.postComment.findMany({
    where: { postId },
    include: { user: { select: safeUserSelect } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ ok: true, comments });
};

export const deleteComment = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const c = await prisma.postComment.findUnique({
    where: { id: req.params.commentId },
    include: { post: { select: { userId: true } } },
  });
  if (!c) throw NotFound('Comment not found');
  // Comment author OR post author can delete
  if (c.userId !== userId && c.post.userId !== userId) {
    throw Forbidden('Cannot delete this comment');
  }
  await prisma.$transaction([
    prisma.postComment.delete({ where: { id: c.id } }),
    prisma.post.update({
      where: { id: c.postId },
      data: { commentCount: { decrement: 1 } },
    }),
  ]);
  res.json({ ok: true });
};

// ─── Shares ──────────────────────────────────────

export const sharePost = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const postId = req.params.id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw NotFound('Post not found');

  const existing = await prisma.postShare.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) return res.json({ ok: true, shared: true });

  await prisma.$transaction([
    prisma.postShare.create({ data: { userId, postId } }),
    prisma.post.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
    }),
  ]);

  res.json({ ok: true, shared: true });
};

// ─── Follow / Unfollow ───────────────────────────

export const follow = async (req: Request, res: Response) => {
  const followerId = req.user!.id;
  const followingId = req.params.userId;

  if (followerId === followingId) throw BadRequest("Cannot follow yourself");

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) throw NotFound('User not found');

  // Block check (cannot follow if either side has blocked)
  const blocked = await getBlockedUserIds(followerId);
  if (blocked.includes(followingId)) throw Forbidden('Cannot follow blocked user');

  // Upsert pattern — idempotent
  const wasFollowing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });

  // Only notify on a new follow, not idempotent re-call
  if (!wasFollowing) {
    const followerName = await getDisplayName(followerId);
    await notify({
      userId: followingId,
      fromUserId: followerId,
      type: 'FOLLOW',
      title: `${followerName} started following you`,
      link: `/dashboard/profile/${followerId}`,
    });
  }

  res.json({ ok: true, following: true });
};

export const unfollow = async (req: Request, res: Response) => {
  const followerId = req.user!.id;
  const followingId = req.params.userId;
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
  res.json({ ok: true, following: false });
};

// ─── User profiles ───────────────────────────────

export const getUserProfile = async (req: Request, res: Response) => {
  const viewerId = req.user!.id;
  const targetId = req.params.userId;

  // Block check
  const blocked = await getBlockedUserIds(viewerId);
  if (blocked.includes(targetId)) throw NotFound('User not available');

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      ...safeUserSelect,
      bio: true,
      createdAt: true,
      _count: {
        select: { followers: true, following: true, posts: true, certificates: true },
      },
    },
  });
  if (!user) throw NotFound('User not found');

  // Is the viewer following this user?
  const followRel = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
  });

  res.json({
    ok: true,
    user: { ...user, isFollowedByMe: !!followRel, isMe: viewerId === targetId },
  });
};

export const getUserPosts = async (req: Request, res: Response) => {
  const viewerId = req.user!.id;
  const targetId = req.params.userId;

  const blocked = await getBlockedUserIds(viewerId);
  if (blocked.includes(targetId)) throw NotFound('User not available');

  // Visibility filter
  const isMe = viewerId === targetId;
  const isFollower = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
  });

  const visibilityFilter: any = isMe
    ? {}
    : isFollower
    ? { visibility: { in: ['PUBLIC', 'FOLLOWERS_ONLY'] } }
    : { visibility: 'PUBLIC' };

  const posts = await prisma.post.findMany({
    where: { userId: targetId, ...visibilityFilter },
    include: {
      user: { select: safeUserSelect },
      likes: { where: { userId: viewerId }, select: { id: true } },
      _count: { select: { likes: true, comments: true, shares: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const items = posts.map((p: any) => ({
    ...p,
    isLikedByMe: p.likes.length > 0,
    likes: undefined,
  }));
  res.json({ ok: true, posts: items });
};

// ─── Search users (basic) ────────────────────────

export const searchUsers = async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim() ?? '';
  if (!q || q.length < 2) return res.json({ ok: true, users: [] });

  const viewerId = req.user!.id;
  const blocked = await getBlockedUserIds(viewerId);

  const users = await prisma.user.findMany({
    where: {
      id: { not: { in: blocked } },
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { ...safeUserSelect, _count: { select: { followers: true } } },
    take: 20,
  });

  res.json({ ok: true, users });
};

// ─── Block / Unblock ─────────────────────────────

export const blockUser = async (req: Request, res: Response) => {
  const blockerId = req.user!.id;
  const blockedId = req.params.userId;
  if (blockerId === blockedId) throw BadRequest('Cannot block yourself');

  await prisma.$transaction([
    // Remove any existing follow in either direction
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    }),
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    }),
  ]);

  res.json({ ok: true, blocked: true });
};

export const unblockUser = async (req: Request, res: Response) => {
  const blockerId = req.user!.id;
  const blockedId = req.params.userId;
  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
  res.json({ ok: true, blocked: false });
};

// ─── Update own profile bio/headline ─────────────

const profileSchema = z.object({
  bio: z.string().max(2000).optional(),
  headline: z.string().max(120).optional(),
});

export const updateMyProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = profileSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { ...safeUserSelect, bio: true },
  });
  res.json({ ok: true, user });
};

// ─── Notifications helper ──────────────────────

import { saveAvatar, savePostImage, deleteUploadedFile } from '../middleware/upload.js';

async function notify(params: {
  userId: string;          // who receives
  fromUserId?: string;     // who triggered
  type: 'POST_LIKE' | 'POST_COMMENT' | 'FOLLOW';
  title: string;
  body?: string;
  link?: string;
}) {
  // Don't notify yourself
  if (params.fromUserId && params.fromUserId === params.userId) return;
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        fromUserId: params.fromUserId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    });
  } catch (e) {
    // Swallow — notifications failing shouldn't break the parent action
    console.error('Notification create failed:', e);
  }
}

// Helper to fetch a user's display name
async function getDisplayName(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, email: true },
  });
  if (!u) return 'Someone';
  if (u.firstName || u.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return u.email.split('@')[0];
}

// ─── Avatar upload ─────────────────────────────

export const uploadAvatar = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  if (!req.file) throw BadRequest('No image uploaded');

  // Save new avatar to disk
  const url = await saveAvatar(req.file);

  // Delete old avatar if it was on our disk
  const old = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  if (old?.avatarUrl?.startsWith('/uploads/')) {
    await deleteUploadedFile(old.avatarUrl);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url },
    select: { id: true, avatarUrl: true },
  });
  res.json({ ok: true, user });
};

// ─── Post image upload (returns URL only) ──────

export const uploadPostImage = async (req: Request, res: Response) => {
  if (!req.file) throw BadRequest('No image uploaded');
  const url = await savePostImage(req.file);
  res.json({ ok: true, url });
};

// ─── Reports ───────────────────────────────────

const reportSchema = z.object({
  reason: z.enum([
    'SPAM',
    'HARASSMENT',
    'HATE_SPEECH',
    'INAPPROPRIATE',
    'MISINFORMATION',
    'COPYRIGHT',
    'OTHER',
  ]),
  details: z.string().max(1000).optional(),
});

export const reportPost = async (req: Request, res: Response) => {
  const reporterId = req.user!.id;
  const postId = req.params.id;
  const { reason, details } = reportSchema.parse(req.body);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw NotFound('Post not found');
  if (post.userId === reporterId) throw BadRequest('Cannot report your own post');

  try {
    await prisma.report.create({
      data: { postId, reporterId, reason, details },
    });
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw BadRequest('You have already reported this post');
    }
    throw e;
  }

  res.status(201).json({ ok: true });
};
