import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env, isProd } from './config/env.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
import { logger } from './utils/logger.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import routes from './routes/index.js';
import { initSocket } from './sockets/index.js';

const app = express();

// ---- Security & middleware ----
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false, // SPA frontend handles its own CSP
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  }),
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

if (!isProd) app.use(morgan('dev'));

app.use(generalLimiter);

// ---- Routes ----
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

// ---- Boot ----
const server = http.createServer(app);
initSocket(server);

const port = env.PORT;
server.listen(port, () => {
  logger.info(`🚀 Scholr API listening on http://localhost:${port}`);
  logger.info(`   env=${env.NODE_ENV} model=${env.OPENAI_MODEL}`);
});

// ---- Graceful shutdown ----
const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down`);
  server.close(() => logger.info('HTTP server closed'));
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection');
});
