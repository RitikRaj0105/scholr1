import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service.js';
import { Unauthorized, Forbidden } from '../utils/errors.js';
import type { Role } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  // Also accept cookie (for SSR / same-site flows)
  if (req.cookies?.accessToken) return req.cookies.accessToken as string;
  return null;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw Unauthorized('Missing access token');

  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, role: payload.role as Role };
  next();
};

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw Unauthorized();
    if (!roles.includes(req.user.role)) throw Forbidden('Insufficient permissions');
    next();
  };

/** Optional auth — attaches user if present, but doesn't reject if missing. */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role as Role };
  } catch {
    /* ignore */
  }
  next();
};
