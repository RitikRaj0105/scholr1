import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './lib/prisma.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import apiRouter from './routes/index.js';
import { registerSocketHandlers } from './sockets/index.js';

const app = express();
const server = http.createServer(app);

// ────────── Security & parsing ──────────
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, cb) => {
      const allow = [env.clientUrl, 'http://localhost:5173', 'http://localhost:3000'];
      if (!origin || allow.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
        return cb(null, true);
      }
      cb(null, true); // permissive in dev; tighten in prod via env
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(generalLimiter);

// ────────── Health & meta ──────────
app.get('/', (_req, res) => res.json({ name: 'Scholr API', status: 'ok', version: '1.0.0' }));
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'down', message: e.message });
  }
});

// ────────── API ──────────
app.use('/api', apiRouter);

// ────────── Errors ──────────
app.use(notFound);
app.use(errorHandler);

// ────────── Socket.io ──────────
const io = new SocketServer(server, {
  cors: { origin: true, credentials: true },
  path: '/socket.io',
});
registerSocketHandlers(io);
app.set('io', io);

// ────────── Start ──────────
server.listen(env.port, () => {
  logger.info(`Scholr API ready → http://localhost:${env.port}`);
});

const shutdown = async (sig) => {
  logger.info(`${sig} received — shutting down`);
  server.close(() => process.exit(0));
  await prisma.$disconnect().catch(() => {});
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
