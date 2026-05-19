import rateLimit from 'express-rate-limit';

/**
 * Note: in a multi-instance deployment, swap MemoryStore for a Redis-backed
 * store like `rate-limit-redis`. Kept simple here so dev works without Redis.
 */

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' } },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many auth attempts' } },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: { code: 'TOO_MANY_REQUESTS', message: 'AI rate limit exceeded' } },
});
