import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

// ── Study rooms ──
export const listRooms = async (userId) =>
  prisma.studyRoom.findMany({
    where: { OR: [{ isPublic: true }, { members: { some: { userId } } }, { ownerId: userId }] },
    include: { _count: { select: { members: true } }, owner: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

export const createRoom = (userId, data) =>
  prisma.studyRoom.create({
    data: {
      ...data, ownerId: userId,
      members: { create: { userId, role: 'MODERATOR' } },
    },
  });

export const joinRoom = async (userId, roomId) => {
  const room = await prisma.studyRoom.findUnique({ where: { id: roomId }, include: { _count: { select: { members: true } } } });
  if (!room) throw ApiError.notFound();
  if (room._count.members >= room.maxMembers) throw ApiError.badRequest('Room full');
  return prisma.studyRoomMember.upsert({
    where: { userId_roomId: { userId, roomId } },
    create: { userId, roomId },
    update: {},
  });
};

export const leaveRoom = async (userId, roomId) => {
  await prisma.studyRoomMember.deleteMany({ where: { userId, roomId } });
  return { ok: true };
};

export const roomMessages = (roomId, take = 50) =>
  prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take,
    include: { sender: { select: { id: true, username: true, avatar: true } } },
  }).then((m) => m.reverse());

export const sendRoomMessage = async (userId, roomId, content, io) => {
  const member = await prisma.studyRoomMember.findUnique({ where: { userId_roomId: { userId, roomId } } });
  if (!member) throw ApiError.forbidden('Not a room member');
  const msg = await prisma.message.create({
    data: { roomId, senderId: userId, content },
    include: { sender: { select: { id: true, username: true, avatar: true } } },
  });
  io?.to(`room:${roomId}`).emit('room:message', msg);
  return msg;
};

// ── Friends ──
export const sendFriendRequest = async (userId, toId) => {
  if (userId === toId) throw ApiError.badRequest("Can't friend yourself");
  return prisma.friendship.upsert({
    where: { fromId_toId: { fromId: userId, toId } },
    create: { fromId: userId, toId, status: 'PENDING' },
    update: {},
  });
};

export const respondFriend = async (userId, requestId, accept) => {
  const f = await prisma.friendship.findUnique({ where: { id: requestId } });
  if (!f || f.toId !== userId) throw ApiError.notFound();
  return prisma.friendship.update({
    where: { id: requestId },
    data: { status: accept ? 'ACCEPTED' : 'BLOCKED', acceptedAt: accept ? new Date() : null },
  });
};

export const friendsList = (userId) =>
  prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ fromId: userId }, { toId: userId }],
    },
    include: {
      from: { select: { id: true, username: true, name: true, avatar: true, xp: true, level: true } },
      to:   { select: { id: true, username: true, name: true, avatar: true, xp: true, level: true } },
    },
  }).then((rows) => rows.map((f) => (f.fromId === userId ? f.to : f.from)));

export const friendRequests = (userId) =>
  prisma.friendship.findMany({
    where: { toId: userId, status: 'PENDING' },
    include: { from: { select: { id: true, username: true, name: true, avatar: true } } },
  });

// ── Challenges ──
export const listChallenges = (userId) =>
  prisma.challenge.findMany({
    where: { OR: [{ creatorId: userId }, { entries: { some: { userId } } }] },
    include: { entries: true, creator: { select: { id: true, username: true, avatar: true } } },
    orderBy: { startsAt: 'desc' },
  });

export const createChallenge = (userId, data) =>
  prisma.challenge.create({
    data: {
      ...data,
      creatorId: userId,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      entries: { create: { userId } },
    },
  });

export const joinChallenge = (userId, id) =>
  prisma.challengeEntry.upsert({
    where: { challengeId_userId: { challengeId: id, userId } },
    create: { challengeId: id, userId },
    update: {},
  });

// ── Leaderboard ──
export const leaderboard = async (scope = 'global', take = 25) => {
  if (scope === 'global') {
    return prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take,
      select: { id: true, username: true, name: true, avatar: true, xp: true, level: true, streakCount: true },
    });
  }
  const periodKey = weekKey();
  return prisma.leaderboardEntry.findMany({
    where: { scope, periodKey },
    orderBy: { score: 'desc' },
    take,
    include: { user: { select: { id: true, username: true, avatar: true } } },
  });
};

function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const w = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(w).padStart(2, '0')}`;
}
