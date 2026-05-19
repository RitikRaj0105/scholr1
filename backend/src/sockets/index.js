import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../config/logger.js';
import { prisma } from '../lib/prisma.js';

const onlineUsers = new Map(); // userId -> Set<socket.id>

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const payload = verifyAccessToken(token);
        socket.user = { id: payload.sub, role: payload.role };
      }
      next();
    } catch {
      next(); // allow guests
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.user?.id;
    if (uid) {
      const set = onlineUsers.get(uid) || new Set();
      set.add(socket.id);
      onlineUsers.set(uid, set);
      io.emit('presence:update', { userId: uid, online: true });
    }

    socket.on('room:join', async ({ roomId }) => {
      if (!uid) return;
      const member = await prisma.studyRoomMember.findUnique({
        where: { userId_roomId: { userId: uid, roomId } },
      });
      if (!member) {
        await prisma.studyRoomMember.create({ data: { userId: uid, roomId } }).catch(() => {});
      }
      socket.join(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('room:presence', { roomId, userId: uid, joined: true });
    });

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('room:presence', { roomId, userId: uid, joined: false });
    });

    socket.on('room:message', async ({ roomId, content }) => {
      if (!uid || !content?.trim()) return;
      const member = await prisma.studyRoomMember.findUnique({
        where: { userId_roomId: { userId: uid, roomId } },
      });
      if (!member) return;
      const msg = await prisma.message.create({
        data: { roomId, senderId: uid, content: content.slice(0, 2000) },
        include: { sender: { select: { id: true, username: true, avatar: true } } },
      });
      io.to(`room:${roomId}`).emit('room:message', msg);
    });

    socket.on('focus:start', ({ sessionId }) => {
      if (!uid) return;
      io.emit('focus:start', { userId: uid, sessionId });
    });

    socket.on('typing', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('typing', { userId: uid });
    });

    socket.on('disconnect', () => {
      if (!uid) return;
      const set = onlineUsers.get(uid);
      if (set) {
        set.delete(socket.id);
        if (!set.size) {
          onlineUsers.delete(uid);
          io.emit('presence:update', { userId: uid, online: false });
        }
      }
    });
  });

  logger.info('🔌 Socket.io ready');
}

export function isOnline(userId) {
  return onlineUsers.has(userId);
}
