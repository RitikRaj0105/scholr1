import type { Server as HttpServer } from 'node:http';
import { Server as IOServer, type Socket } from 'socket.io';
import { verifyAccessToken } from '../services/token.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface ServerToClient {
  notification: (n: { id: string; title: string; body?: string; type: string }) => void;
  presence: (p: { userId: string; online: boolean }) => void;
  'chat:message': (m: { from: string; content: string; at: string }) => void;
}

export interface ClientToServer {
  'chat:send': (m: { to: string; content: string }) => void;
  ping: () => void;
}

export interface SocketData {
  userId: string;
  role: string;
}

export type ScholrIO = IOServer<ClientToServer, ServerToClient, Record<string, never>, SocketData>;

let io: ScholrIO | null = null;

export const initSocket = (server: HttpServer): ScholrIO => {
  io = new IOServer<ClientToServer, ServerToClient, Record<string, never>, SocketData>(server, {
    cors: { origin: env.CORS_ORIGIN.split(','), credentials: true },
    transports: ['websocket', 'polling'],
  });

  // JWT auth handshake
  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        socket.handshake.headers.authorization?.replace(/^Bearer /, '');
      if (!token) return next(new Error('missing token'));
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>) => {
    const { userId } = socket.data;
    socket.join(`user:${userId}`);
    logger.debug({ userId }, 'socket connected');

    socket.on('chat:send', ({ to, content }) => {
      if (!to || !content) return;
      io?.to(`user:${to}`).emit('chat:message', {
        from: userId,
        content,
        at: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      logger.debug({ userId }, 'socket disconnected');
    });
  });

  return io;
};

/** Emit a notification to a specific user across all their devices. */
export const emitNotification = (
  userId: string,
  n: { id: string; title: string; body?: string; type: string },
) => {
  io?.to(`user:${userId}`).emit('notification', n);
};

export const getIO = (): ScholrIO | null => io;
