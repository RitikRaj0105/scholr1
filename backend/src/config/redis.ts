import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Redis is optional in development. If REDIS_URL is not set, we export `null`
 * and consumers (rate limiter, queues, caches) should degrade gracefully.
 */
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  : null;

if (redis) {
  redis.on('connect', () => logger.info('✓ Redis connected'));
  redis.on('error', (err) => logger.error({ err }, 'Redis error'));
} else {
  logger.warn('REDIS_URL not set — queues, distributed rate-limit, and caches are disabled');
}
